
import mongoose from "mongoose";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import { getPaginationMeta } from "../../utils/pagination";

export const createPurchaseEntry = async (
    data: Record<string, unknown>,
) => {
    const purchaseEntry = await PurchaseEntryModel.create(data);

    const result = await PurchaseEntryModel.aggregate([
        {
            $match: {
                _id: purchaseEntry._id,
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: "vendors",
                localField: "vendor",
                foreignField: "_id",
                as: "vendor",
            },
        },
        {
            $unwind: {
                path: "$vendor",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                "vendor.__v": 0,
            },
        },
    ]);

    return result[0] ?? null;
};

export const findPurchaseEntryById = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        return null;
    }

    const result = await PurchaseEntryModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: "vendors",
                localField: "vendor",
                foreignField: "_id",
                as: "vendor",
            },
        },
        {
            $unwind: {
                path: "$vendor",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                "vendor.__v": 0,
            },
        },
    ]);

    return result[0] ?? null;
};

export const findPurchaseEntryByInvoiceNo = async (
    invoiceNo: string,
) => {
    const result = await PurchaseEntryModel.aggregate([
        {
            $match: {
                invoiceNo,
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: "vendors",
                localField: "vendor",
                foreignField: "_id",
                as: "vendor",
            },
        },
        {
            $unwind: {
                path: "$vendor",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                "vendor.__v": 0,
            },
        },
        {
            $limit: 1,
        },
    ]);

    return result[0] ?? null;
};

export const getAllPurchaseEntries = async (
    page: number,
    limit: number,
) => {
    const skip = (page - 1) * limit;

    const result = await PurchaseEntryModel.aggregate([
        {
            $match: {
                isDeleted: false,
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $facet: {
                data: [
                    {
                        $skip: skip,
                    },
                    {
                        $limit: limit,
                    },
                    {
                        $lookup: {
                            from: "vendors",
                            localField: "vendor",
                            foreignField: "_id",
                            as: "vendor",
                        },
                    },
                    {
                        $unwind: {
                            path: "$vendor",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            "vendor.__v": 0,
                        },
                    },
                ],
                totalRecords: [
                    {
                        $count: "count",
                    },
                ],
            },
        },
    ]);

    const data = result[0]?.data ?? [];
    const totalRecords = result[0]?.totalRecords[0]?.count ?? 0;

    return {
        data,
        pagination: getPaginationMeta(page, limit, totalRecords),
    };
};

export const updatePurchaseEntryById = async (
    id: string,
    updateData: Record<string, unknown>,
) => {
    if (!mongoose.isValidObjectId(id)) {
        return null;
    }

    await PurchaseEntryModel.updateOne(
        {
            _id: new mongoose.Types.ObjectId(id),
            isDeleted: false,
        },
        {
            $set: updateData,
        },
        {
            runValidators: true,
        },
    );

    return findPurchaseEntryById(id);
};

export const deletePurchaseEntryById = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) {
        return null;
    }

    const result = await PurchaseEntryModel.updateOne(
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
    );

    if (result.matchedCount === 0) {
        return null;
    }

    return {
        _id: id,
        isDeleted: true,
    };
};

export const countPurchaseEntries = async () => {
    return PurchaseEntryModel.countDocuments({
        isDeleted: false,
    });
};

export const purchaseInvoiceExists = async (invoiceNo: string) => {
    return PurchaseEntryModel.exists({
        invoiceNo,
    });
};
