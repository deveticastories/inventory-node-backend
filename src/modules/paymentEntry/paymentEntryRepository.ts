
import mongoose from "mongoose";
import PaymentEntryModel from "../../models/paymentEntryModel";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import VendorModel from "../../models/vendorModel";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import { getPaginationMeta } from "../../utils/pagination";

const getPaymentEntryPipeline = () => [
    {
        $lookup: {
            from: PurchaseEntryModel.collection.name,
            localField: "purchaseInvoice",
            foreignField: "_id",
            as: "purchaseInvoice",
        },
    },
    {
        $unwind: {
            path: "$purchaseInvoice",
            preserveNullAndEmptyArrays: true,
        },
    },
    {
        $lookup: {
            from: VendorModel.collection.name,
            localField: "purchaseInvoice.vendor",
            foreignField: "_id",
            as: "purchaseInvoice.vendor",
        },
    },
    {
        $unwind: {
            path: "$purchaseInvoice.vendor",
            preserveNullAndEmptyArrays: true,
        },
    },
];

export const createPaymentEntry = async (
    paymentEntryData: Record<string, unknown>,
) => {
    const paymentEntry = await PaymentEntryModel.create(paymentEntryData);

    const results = await PaymentEntryModel.aggregate([
        {
            $match: {
                _id: paymentEntry._id,
                isDeleted: false,
            },
        },
        ...getPaymentEntryPipeline(),
    ]);

    return results[0] ?? null;
};

export const findPaymentEntryById = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    const results = await PaymentEntryModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                isDeleted: false,
            },
        },
        ...getPaymentEntryPipeline(),
        {
            $limit: 1,
        },
    ]);

    return results[0] ?? null;
};

export const findPaymentEntryByPurchaseEntry = async (
    purchaseInvoice: string,
) => {
    if (!mongoose.Types.ObjectId.isValid(purchaseInvoice)) {
        throw new Error("PURCHASE_ENTRY_ID_INVALID");
    }

    return PaymentEntryModel.aggregate([
        {
            $match: {
                purchaseInvoice: new mongoose.Types.ObjectId(purchaseInvoice),
                isDeleted: false,
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        ...getPaymentEntryPipeline(),
    ]);
};

// Current position of the purchase invoice: QC payable, total paid, balance
const purchaseInvoiceBalanceStages = () => [
    {
        $lookup: {
            from: PurchaseQualityCheckModel.collection.name,
            let: { purchaseId: "$purchaseInvoice._id" },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$purchaseEntry", "$$purchaseId"] },
                        isDeleted: false,
                    },
                },
                { $project: { payableAfterQC: 1 } },
            ],
            as: "qualityCheck",
        },
    },
    {
        $lookup: {
            from: PaymentEntryModel.collection.name,
            let: { purchaseId: "$purchaseInvoice._id" },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$purchaseInvoice", "$$purchaseId"] },
                        isDeleted: false,
                    },
                },
                { $group: { _id: null, totalPaid: { $sum: "$paidAmount" } } },
            ],
            as: "paidSummary",
        },
    },
    {
        $set: {
            invoicePayable: {
                $ifNull: [{ $first: "$qualityCheck.payableAfterQC" }, 0],
            },
            invoicePaid: { $ifNull: [{ $first: "$paidSummary.totalPaid" }, 0] },
        },
    },
    {
        $set: {
            invoiceBalance: {
                $max: [0, { $subtract: ["$invoicePayable", "$invoicePaid"] }],
            },
        },
    },
    { $unset: ["qualityCheck", "paidSummary"] },
];

export const getAllPaymentEntries = async (
    page: number,
    limit: number,
    status: "all" | "paid" | "outstanding" = "all",
    sortBy: "date" | "vendor" = "date",
) => {
    const skip = (page - 1) * limit;
    const statusMatch =
        status === "paid"
            ? [{ $match: { invoiceBalance: { $lte: 0.5 } } }]
            : status === "outstanding"
                ? [{ $match: { invoiceBalance: { $gt: 0.5 } } }]
                : [];
    const sort: Record<string, 1 | -1> =
        sortBy === "vendor"
            ? { "purchaseInvoice.vendor.vendorName": 1, createdAt: -1 }
            : { paymentDate: -1, createdAt: -1 };

    const result = await PaymentEntryModel.aggregate([
        { $match: { isDeleted: false } },
        ...getPaymentEntryPipeline(),
        ...purchaseInvoiceBalanceStages(),
        ...statusMatch,
        { $sort: sort },
        {
            $facet: {
                data: [{ $skip: skip }, { $limit: limit }],
                totalRecords: [{ $count: "count" }],
            },
        },
    ]);

    const totalRecords = result[0]?.totalRecords[0]?.count ?? 0;

    return {
        data: result[0]?.data ?? [],
        pagination: getPaginationMeta(page, limit, totalRecords),
    };
};

/** QC-approved purchase invoices with an outstanding balance. */
export const findPayableInvoices = async () => {
    const rows = await PurchaseEntryModel.aggregate([
        { $match: { isDeleted: false, qcStatus: "Done" } },
        { $project: { purchaseInvoice: "$$ROOT" } },
        {
            $lookup: {
                from: VendorModel.collection.name,
                localField: "purchaseInvoice.vendor",
                foreignField: "_id",
                as: "purchaseInvoice.vendor",
            },
        },
        {
            $unwind: {
                path: "$purchaseInvoice.vendor",
                preserveNullAndEmptyArrays: true,
            },
        },
        ...purchaseInvoiceBalanceStages(),
        { $match: { invoiceBalance: { $gt: 0.5 } } },
        { $sort: { "purchaseInvoice.purchaseDate": -1 } },
    ]);

    return rows.map((row) => ({
        _id: row.purchaseInvoice._id,
        invoiceNo: row.purchaseInvoice.invoiceNo,
        purchaseDate: row.purchaseInvoice.purchaseDate,
        vendor: row.purchaseInvoice.vendor,
        payableAmount: row.invoicePayable,
        paidAmount: row.invoicePaid,
        balanceAmount: row.invoiceBalance,
    }));
};

export const updatePaymentEntryById = async (
    id: string,
    updateData: Record<string, unknown>,
) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    const updated = await PaymentEntryModel.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(id),
            isDeleted: false,
        },
        { $set: updateData },
        { new: true, runValidators: true },
    ).exec();

    if (!updated) {
        return null;
    }

    return findPaymentEntryById(id);
};

export const deletePaymentEntry = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    return PaymentEntryModel.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(id),
            isDeleted: false,
        },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy,
            },
        },
        { new: true },
    ).exec();
};
