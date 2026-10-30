
import mongoose from "mongoose";
import * as paymentEntryRepo from "./paymentEntryRepository";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import PaymentEntryModel from "../../models/paymentEntryModel";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import { round2 } from "../../utils/errorStatus";

const generatePaymentVoucherNo = async (): Promise<string> => {
    const lastEntry = await PaymentEntryModel.findOne({
        paymentVoucherNo: { $regex: /^PAY-\d+$/ },
    })
        .sort({ createdAt: -1 })
        .select("paymentVoucherNo")
        .lean();

    const lastNumber = lastEntry
        ? parseInt(lastEntry.paymentVoucherNo.replace("PAY-", ""), 10)
        : 0;

    return `PAY-${String(lastNumber + 1).padStart(4, "0")}`;
};

export interface CreatePaymentEntryInput {
    purchaseInvoice: string;
    paidAmount: number;
}

export const createPaymentEntry = async (
    paymentData: CreatePaymentEntryInput,
    createdBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(paymentData.purchaseInvoice)) {
        throw new Error("PURCHASE_ENTRY_ID_INVALID");
    }

    if (
        !Number.isFinite(paymentData.paidAmount) ||
        paymentData.paidAmount <= 0
    ) {
        throw new Error("PAYMENT_AMOUNT_INVALID");
    }

    const purchaseEntry = await PurchaseEntryModel.findOne({
        _id: new mongoose.Types.ObjectId(paymentData.purchaseInvoice),
        isDeleted: false,
    }).lean();

    if (!purchaseEntry) {
        throw new Error("PURCHASE_ENTRY_NOT_FOUND");
    }

    const previousPayments = await PaymentEntryModel.aggregate([
        {
            $match: {
                purchaseInvoice: new mongoose.Types.ObjectId(
                    paymentData.purchaseInvoice,
                ),
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: null,
                totalPaid: { $sum: "$paidAmount" },
            },
        },
    ]);

    // Vendors are paid only against QC-approved invoices; the payable is
    // the GST-adjusted approved value posted by the quality check.
    const qualityCheck = await PurchaseQualityCheckModel.findOne({
        purchaseEntry: purchaseEntry._id,
        isDeleted: false,
    })
        .select("payableAfterQC")
        .lean<{ payableAfterQC: number }>();

    if (purchaseEntry.qcStatus !== "Done" || !qualityCheck) {
        throw new Error("PURCHASE_QC_PENDING");
    }

    const totalPaid = previousPayments[0]?.totalPaid ?? 0;
    const currentBalance = round2(
        Math.max(0, qualityCheck.payableAfterQC - totalPaid),
    );

    if (paymentData.paidAmount > currentBalance + 0.01) {
        throw new Error("PAYMENT_EXCEEDS_BALANCE");
    }

    const paymentVoucherNo = await generatePaymentVoucherNo();
    const balanceAmount = round2(
        Math.max(0, currentBalance - paymentData.paidAmount),
    );

    const paymentEntry = await paymentEntryRepo.createPaymentEntry({
        paymentVoucherNo,
        purchaseInvoice: new mongoose.Types.ObjectId(
            paymentData.purchaseInvoice,
        ),
        vendor: purchaseEntry.vendor,
        paymentDate: new Date(),
        payableAmount: currentBalance,
        paidAmount: paymentData.paidAmount,
        balanceAmount,
        createdBy,
    });

    return paymentEntry;
};

export type PaymentListFilter = "all" | "paid" | "outstanding";

export const getAllPaymentEntries = async (
    page: number,
    limit: number,
    status: PaymentListFilter = "all",
    sortBy: "date" | "vendor" = "date",
) => {
    return paymentEntryRepo.getAllPaymentEntries(page, limit, status, sortBy);
};

/** QC-approved purchase invoices that still have a balance to pay. */
export const getPayableInvoices = async () => {
    return paymentEntryRepo.findPayableInvoices();
};

export const getPaymentEntryById = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PAYMENT_ENTRY_ID_INVALID");
    }

    return paymentEntryRepo.findPaymentEntryById(id);
};

export const getPaymentEntriesByPurchaseEntry = async (
    purchaseInvoice: string,
) => {
    if (!mongoose.isValidObjectId(purchaseInvoice)) {
        throw new Error("PURCHASE_ENTRY_ID_INVALID");
    }

    return paymentEntryRepo.findPaymentEntryByPurchaseEntry(
        purchaseInvoice,
    );
};

export const editPaymentEntry = async (
    id: string,
    updateData: Partial<CreatePaymentEntryInput>,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PAYMENT_ENTRY_ID_INVALID");
    }

    const existingEntry = await paymentEntryRepo.findPaymentEntryById(id);

    if (!existingEntry) {
        return null;
    }

    if (updateData.purchaseInvoice || updateData.paidAmount !== undefined) {
        throw new Error("PAYMENT_ENTRY_EDIT_NOT_ALLOWED");
    }

    return paymentEntryRepo.updatePaymentEntryById(id, updateData);
};

export const deletePaymentEntry = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PAYMENT_ENTRY_ID_INVALID");
    }

    return paymentEntryRepo.deletePaymentEntry(id, deletedBy);
};
