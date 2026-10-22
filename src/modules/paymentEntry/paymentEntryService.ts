
import mongoose from "mongoose";
import * as paymentEntryRepo from "./paymentEntryRepository";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import PaymentEntryModel from "../../models/paymentEntryModel";

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

    const totalPaid = previousPayments[0]?.totalPaid ?? 0;
    const payableAmount = purchaseEntry.totalIncludingGST;
    const currentBalance = Math.max(0, payableAmount - totalPaid);

    if (paymentData.paidAmount > currentBalance) {
        throw new Error("PAYMENT_EXCEEDS_BALANCE");
    }

    const paymentVoucherNo = await generatePaymentVoucherNo();
    const balanceAmount = currentBalance - paymentData.paidAmount;

    const paymentEntry = await paymentEntryRepo.createPaymentEntry({
        paymentVoucherNo,
        purchaseInvoice: new mongoose.Types.ObjectId(
            paymentData.purchaseInvoice,
        ),
        paidAmount: paymentData.paidAmount,
        balanceAmount,
        createdBy,
    });

    return paymentEntry;
};

export const getAllPaymentEntries = async (
    page: number,
    limit: number,
) => {
    return paymentEntryRepo.getAllPaymentEntries(page, limit);
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
