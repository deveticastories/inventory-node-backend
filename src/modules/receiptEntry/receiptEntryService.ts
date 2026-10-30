
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
        receiptDate: new Date(),
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

    const deleted = await receiptEntryRepo.softDeleteReceiptEntry(
        id,
        deletedBy,
    );

    await refreshBillingTotals(existing.invoice);

    return deleted;
};
