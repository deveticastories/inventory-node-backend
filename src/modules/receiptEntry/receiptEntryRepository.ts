
import mongoose from "mongoose";
import ReceiptEntryModel from "../../models/receiptEntryModel";
import BillingModel from "../../models/billingModel";
import CustomerModel from "../../models/customerModel";
import { getPaginationMeta } from "../../utils/pagination";

const getReceiptEntryPipeline = () => [
    {
        $lookup: {
            from: BillingModel.collection.name,
            localField: "invoice",
            foreignField: "_id",
            as: "invoice",
        },
    },
    {
        $unwind: {
            path: "$invoice",
            preserveNullAndEmptyArrays: true,
        },
    },
    {
        $lookup: {
            from: CustomerModel.collection.name,
            localField: "invoice.customer",
            foreignField: "_id",
            as: "customerDetails",
        },
    },
    {
        $unwind: {
            path: "$customerDetails",
            preserveNullAndEmptyArrays: true,
        },
    },
    {
        $set: {
            "invoice.customer": "$customerDetails",
        },
    },
    {
        $unset: "customerDetails",
    },
];

export const createReceiptEntry = async (
    data: Record<string, unknown>,
) => {
    const receipt = await ReceiptEntryModel.create(data);

    const result = await ReceiptEntryModel.aggregate([
        {
            $match: {
                _id: receipt._id,
                isDeleted: false,
            },
        },
        ...getReceiptEntryPipeline(),
    ]);

    return result[0] ?? null;
};

export const findReceiptEntryById = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) return null;

    const result = await ReceiptEntryModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                isDeleted: false,
            },
        },
        ...getReceiptEntryPipeline(),
        { $limit: 1 },
    ]);

    return result[0] ?? null;
};

export const findReceiptEntriesByInvoice = async (
    invoiceId: string,
) => {
    if (!mongoose.isValidObjectId(invoiceId)) {
        throw new Error("BILLING_INVOICE_ID_INVALID");
    }

    return ReceiptEntryModel.aggregate([
        {
            $match: {
                invoice: new mongoose.Types.ObjectId(invoiceId),
                isDeleted: false,
            },
        },
        { $sort: { createdAt: -1 } },
        ...getReceiptEntryPipeline(),
    ]);
};

export const getAllReceiptEntries = async (
    page: number,
    limit: number,
    status: "all" | "paid" | "outstanding" = "all",
    sortBy: "date" | "customer" = "date",
) => {
    const skip = (page - 1) * limit;
    // paid / outstanding refers to the invoice's current balance
    const statusMatch =
        status === "paid"
            ? [{ $match: { "invoice.balanceAmount": { $lte: 0.5 } } }]
            : status === "outstanding"
                ? [{ $match: { "invoice.balanceAmount": { $gt: 0.5 } } }]
                : [];
    const sort: Record<string, 1 | -1> =
        sortBy === "customer"
            ? { "invoice.customer.name": 1, createdAt: -1 }
            : { receiptDate: -1, createdAt: -1 };

    const result = await ReceiptEntryModel.aggregate([
        { $match: { isDeleted: false } },
        ...getReceiptEntryPipeline(),
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

/** Invoices that still have a balance to receive. */
export const findReceivableInvoices = async () => {
    return BillingModel.find({
        isDeleted: false,
        balanceAmount: { $gt: 0.5 },
    })
        .populate("customer", "name contactNo")
        .select("invoiceNo date customer netAmount receivedAmount balanceAmount")
        .sort({ date: -1 })
        .lean();
};

export const updateReceiptEntryById = async (
    id: string,
    updateData: Record<string, unknown>,
) => {
    if (!mongoose.isValidObjectId(id)) return null;

    const updated = await ReceiptEntryModel.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(id),
            isDeleted: false,
        },
        { $set: updateData },
        { new: true, runValidators: true },
    ).exec();

    if (!updated) return null;

    return findReceiptEntryById(id);
};

export const softDeleteReceiptEntry = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) return null;

    return ReceiptEntryModel.findOneAndUpdate(
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

export const findLatestReceiptEntry = async () => {
    return ReceiptEntryModel.findOne({
        receiptNo: { $regex: /^REC-\d+$/ },
    })
        .sort({ createdAt: -1 })
        .select("receiptNo")
        .lean();
};
