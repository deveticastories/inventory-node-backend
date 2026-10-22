
import mongoose from "mongoose";
import PaymentEntryModel from "../../models/paymentEntryModel";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import VendorModel from "../../models/vendorModel";
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

export const getAllPaymentEntries = async (
    page: number,
    limit: number,
) => {
    const filter = { isDeleted: false };
    const skip = (page - 1) * limit;

    const [data, totalRecords] = await Promise.all([
        PaymentEntryModel.aggregate([
            { $match: filter },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            ...getPaymentEntryPipeline(),
        ]),
        PaymentEntryModel.countDocuments(filter),
    ]);

    return {
        data,
        pagination: getPaginationMeta(page, limit, totalRecords),
    };
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
