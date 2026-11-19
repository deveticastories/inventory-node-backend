
import mongoose from "mongoose";
import * as receiptEntryRepo from "./receiptEntryRepository";
import ReceiptEntryModel from "../../models/receiptEntryModel";
import BillingModel from "../../models/billingModel";
import { refreshBillingTotals } from "../billing/billingService";
import { round2 } from "../../utils/errorStatus";

const generateReceiptNo = async (): Promise<string> => {
    const latest = await receiptEntryRepo.findLatestReceiptEntry();

    const lastNumber = latest
        ? Number(latest.receiptNo.replace("REC-", ""))
        : 0;

    return `REC-${String(lastNumber + 1).padStart(4, "0")}`;
};

export interface CreateReceiptEntryInput {
    invoice: string;
    receivedAmount: number;
    /** Date the customer paid (YYYY-MM-DD); defaults to now. */
    receiptDate?: string;
}

export const createReceiptEntry = async (
    data: CreateReceiptEntryInput,
    createdBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(data.invoice)) {
        throw new Error("BILLING_INVOICE_ID_INVALID");
    }

    if (
        !Number.isFinite(data.receivedAmount) ||
        data.receivedAmount <= 0
    ) {
        throw new Error("RECEIVED_AMOUNT_INVALID");
    }

    const receiptDate = data.receiptDate
        ? new Date(data.receiptDate)
        : new Date();

    if (Number.isNaN(receiptDate.getTime())) {
        throw new Error("RECEIPT_DATE_INVALID");
    }

    const invoiceId = new mongoose.Types.ObjectId(data.invoice);

    const invoice = await BillingModel.findOne({
        _id: invoiceId,
        isDeleted: false,
    });

    if (!invoice) {
        throw new Error("BILLING_INVOICE_NOT_FOUND");
    }

    const outstandingBalance = round2(
        Math.max(0, invoice.netAmount - invoice.receivedAmount),
    );

    if (data.receivedAmount > outstandingBalance + 0.01) {
        throw new Error("RECEIPT_EXCEEDS_BALANCE");
    }

    const balanceAmount = round2(
        Math.max(0, outstandingBalance - data.receivedAmount),
    );

    const receiptNo = await generateReceiptNo();

    const receipt = await receiptEntryRepo.createReceiptEntry({
        receiptNo,
        invoice: invoiceId,
        customer: invoice.customer,
        receiptDate,
        receivableAmount: outstandingBalance,
        receivedAmount: data.receivedAmount,
        balanceAmount,
        createdBy,
    });

    await refreshBillingTotals(invoiceId);

    return receipt;
};

export const getAllReceiptEntries = async (
    page: number,
    limit: number,
    status: "all" | "paid" | "outstanding" = "all",
    sortBy: "date" | "customer" = "date",
) => {
    return receiptEntryRepo.getAllReceiptEntries(page, limit, status, sortBy);
};

export const getReceivableInvoices = async () => {
    return receiptEntryRepo.findReceivableInvoices();
};

export const getReceiptEntryById = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("RECEIPT_ENTRY_ID_INVALID");
    }

    return receiptEntryRepo.findReceiptEntryById(id);
};

export const getReceiptEntriesByInvoice = async (
    invoiceId: string,
) => {
    if (!mongoose.isValidObjectId(invoiceId)) {
        throw new Error("BILLING_INVOICE_ID_INVALID");
    }

    return receiptEntryRepo.findReceiptEntriesByInvoice(invoiceId);
};

export interface EditReceiptEntryInput {
    receivedAmount?: number;
    receiptDate?: string;
}

/**
 * Received amount and date can be edited; the invoice cannot. When the amount
 * changes, the difference is carried into this and every later receipt's
 * receivable/balance snapshot, and the invoice totals are refreshed.
 */
export const editReceiptEntry = async (
    id: string,
    updateData: EditReceiptEntryInput & { invoice?: string },
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("RECEIPT_ENTRY_ID_INVALID");
    }

    const existing = await ReceiptEntryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
    }).lean();

    if (!existing) return null;

    if (updateData.invoice !== undefined) {
        throw new Error("RECEIPT_ENTRY_EDIT_NOT_ALLOWED");
    }

    const update: { receivedAmount?: number; receiptDate?: Date } = {};

    if (updateData.receiptDate !== undefined) {
        const receiptDate = new Date(updateData.receiptDate);

        if (Number.isNaN(receiptDate.getTime())) {
            throw new Error("RECEIPT_DATE_INVALID");
        }

        update.receiptDate = receiptDate;
    }

    let delta = 0;

    if (updateData.receivedAmount !== undefined) {
        const receivedAmount = Number(updateData.receivedAmount);

        if (!Number.isFinite(receivedAmount) || receivedAmount <= 0) {
            throw new Error("RECEIVED_AMOUNT_INVALID");
        }

        const invoice = await BillingModel.findOne({
            _id: existing.invoice,
            isDeleted: false,
        })
            .select("netAmount receivedAmount")
            .lean<{ netAmount: number; receivedAmount: number }>();

        const maxAmount = round2(
            existing.receivedAmount +
                Math.max(
                    0,
                    (invoice?.netAmount ?? 0) - (invoice?.receivedAmount ?? 0),
                ),
        );

        if (receivedAmount > maxAmount + 0.01) {
            throw new Error("RECEIPT_EXCEEDS_BALANCE");
        }

        update.receivedAmount = round2(receivedAmount);
        delta = round2(update.receivedAmount - existing.receivedAmount);
    }

    const updated = await receiptEntryRepo.updateReceiptEntryById(id, update);

    if (delta !== 0) {
        await shiftReceiptSnapshots(existing, delta);
        await refreshBillingTotals(existing.invoice);
        return receiptEntryRepo.findReceiptEntryById(id);
    }

    return updated;
};

/** Carry an amount change into this receipt's balance and every later receipt on the invoice. */
const shiftReceiptSnapshots = async (
    edited: {
        _id: mongoose.Types.ObjectId;
        invoice: mongoose.Types.ObjectId;
        balanceAmount: number;
        createdAt?: Date;
    },
    delta: number,
) => {
    const later = await ReceiptEntryModel.find({
        invoice: edited.invoice,
        isDeleted: false,
        _id: { $ne: edited._id },
        createdAt: { $gt: edited.createdAt },
    })
        .select("receivableAmount balanceAmount")
        .lean();

    await ReceiptEntryModel.bulkWrite([
        {
            updateOne: {
                filter: { _id: edited._id },
                update: {
                    $set: {
                        balanceAmount: round2(
                            Math.max(0, edited.balanceAmount - delta),
                        ),
                    },
                },
            },
        },
        ...later.map((entry) => ({
            updateOne: {
                filter: { _id: entry._id },
                update: {
                    $set: {
                        receivableAmount: round2(
                            Math.max(0, entry.receivableAmount - delta),
                        ),
                        balanceAmount: round2(
                            Math.max(0, entry.balanceAmount - delta),
                        ),
                    },
                },
            },
        })),
    ]);
};

export const deleteReceiptEntry = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("RECEIPT_ENTRY_ID_INVALID");
    }

    const existing = await ReceiptEntryModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
    });

    if (!existing) return null;

    const deleted = await receiptEntryRepo.softDeleteReceiptEntry(
        id,
        deletedBy,
    );

    await refreshBillingTotals(existing.invoice);

    return deleted;
};
