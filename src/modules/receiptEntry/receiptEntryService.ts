
import mongoose from "mongoose";
import * as receiptEntryRepo from "./receiptEntryRepository";
import ReceiptEntryModel from "../../models/receiptEntryModel";
import BillingModel from "../../models/billingModel";

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

    const invoiceId = new mongoose.Types.ObjectId(data.invoice);

    const invoice = await BillingModel.findOne({
        _id: invoiceId,
        isDeleted: false,
    });

    if (!invoice) {
        throw new Error("BILLING_INVOICE_NOT_FOUND");
    }

    const outstandingBalance = Math.max(
        0,
        invoice.netAmount - invoice.receivedAmount,
    );

    if (data.receivedAmount > outstandingBalance) {
        throw new Error("RECEIPT_EXCEEDS_BALANCE");
    }

    const balanceAmount =
        outstandingBalance - data.receivedAmount;

    const receiptNo = await generateReceiptNo();

    const receipt = await receiptEntryRepo.createReceiptEntry({
        receiptNo,
        invoice: invoiceId,
        receivedAmount: data.receivedAmount,
        balanceAmount,
        createdBy,
    });

    invoice.receivedAmount += data.receivedAmount;
    invoice.balanceAmount = Math.max(
        0,
        invoice.netAmount - invoice.receivedAmount,
    );

    await invoice.save();

    return receipt;
};

export const getAllReceiptEntries = async (
    page: number,
    limit: number,
) => {
    return receiptEntryRepo.getAllReceiptEntries(page, limit);
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

export const editReceiptEntry = async (
    id: string,
    updateData: Partial<CreateReceiptEntryInput>,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("RECEIPT_ENTRY_ID_INVALID");
    }

    const existing = await receiptEntryRepo.findReceiptEntryById(id);

    if (!existing) return null;

    if (
        updateData.invoice !== undefined ||
        updateData.receivedAmount !== undefined
    ) {
        throw new Error("RECEIPT_ENTRY_EDIT_NOT_ALLOWED");
    }

    return receiptEntryRepo.updateReceiptEntryById(id, {});
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

    const invoice = await BillingModel.findOne({
        _id: existing.invoice,
        isDeleted: false,
    });

    if (invoice) {
        invoice.receivedAmount = Math.max(
            0,
            invoice.receivedAmount - existing.receivedAmount,
        );
        invoice.balanceAmount = Math.max(
            0,
            invoice.netAmount - invoice.receivedAmount,
        );
        await invoice.save();
    }

    return receiptEntryRepo.softDeleteReceiptEntry(id, deletedBy);
};
