
import mongoose from "mongoose";
import ReceiptEntryModel from "../../models/receiptEntryModel";
import BillingModel from "../../models/billingModel";
import UserModel from "../../models/userModel";
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
            from: UserModel.collection.name,
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
) => {
    const filter = { isDeleted: false };
    const skip = (page - 1) * limit;

    const [data, totalRecords] = await Promise.all([
        ReceiptEntryModel.aggregate([
            { $match: filter },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            ...getReceiptEntryPipeline(),
        ]),
        ReceiptEntryModel.countDocuments(filter),
    ]);

    return {
        data,
        pagination: getPaginationMeta(page, limit, totalRecords),
    };
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
