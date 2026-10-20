import mongoose from "mongoose";
import PackingList from "../../models/packingListModel";
import { getPaginationMeta } from "../../utils/pagination";

const packingListAggregation = [
    {
        $lookup: {
            from: "indianstorestocktransfers",
            localField: "styles.indianStoreStockTransfer",
            foreignField: "_id",
            as: "stockTransfers",
        },
    },
    {
        $lookup: {
            from: "dailyexpenses",
            localField: "dailyExpenses",
            foreignField: "_id",
            as: "expenseDetails",
        },
    },
    {
        $addFields: {
            styles: {
                $map: {
                    input: { $ifNull: ["$styles", []] },
                    as: "style",
                    in: {
                        $let: {
                            vars: {
                                stockTransfer: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$stockTransfers",
                                                as: "transfer",
                                                cond: {
                                                    $eq: [
                                                        "$$transfer._id",
                                                        "$$style.indianStoreStockTransfer",
                                                    ],
                                                },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                            in: {
                                $let: {
                                    vars: {
                                        selectedProduct: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: {
                                                            $ifNull: [
                                                                "$$stockTransfer.products",
                                                                [],
                                                            ],
                                                        },
                                                        as: "product",
                                                        cond: {
                                                            $eq: [
                                                                "$$product._id",
                                                                "$$style.indianStoreStockTransferProduct",
                                                            ],
                                                        },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $mergeObjects: [
                                            "$$style",
                                            {
                                                productDetails: {
                                                    $ifNull: [
                                                        "$$selectedProduct",
                                                        null,
                                                    ],
                                                },
                                                indianStoreStockTransfer: {
                                                    $ifNull: [
                                                        "$$stockTransfer",
                                                        "$$style.indianStoreStockTransfer",
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            dailyExpenses: {
                $map: {
                    input: { $ifNull: ["$dailyExpenses", []] },
                    as: "expenseId",
                    in: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$expenseDetails",
                                            as: "expense",
                                            cond: {
                                                $eq: [
                                                    "$$expense._id",
                                                    "$$expenseId",
                                                ],
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                            "$$expenseId",
                        ],
                    },
                },
            },
        },
    },
    {
        $addFields: {
            totalQty: {
                $sum: {
                    $map: {
                        input: { $ifNull: ["$styles", []] },
                        as: "style",
                        in: {
                            $ifNull: ["$$style.qty", 0],
                        },
                    },
                },
            },
            totalExpense: {
                $sum: {
                    $map: {
                        input: { $ifNull: ["$expenseDetails", []] },
                        as: "expense",
                        in: {
                            $ifNull: ["$$expense.amount", 0],
                        },
                    },
                },
            },
        },
    },
    {
        $project: {
            stockTransfers: 0,
            expenseDetails: 0,
        },
    },
];

export const create = async (
    packingListData: Record<string, unknown>
) => {
    const packingList = new PackingList(packingListData);
    return packingList.save();
};

export const findById = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    const result = await PackingList.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                isDeleted: false,
            },
        },
        ...packingListAggregation,
    ]).exec();

    return result[0] ?? null;
};

export const getAllPackingLists = async (
    page: number,
    limit: number
) => {
    const filter = { isDeleted: false };
    const skip = (page - 1) * limit;

    const [packingLists, totalRecords] = await Promise.all([
        PackingList.aggregate([
            { $match: filter },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            ...packingListAggregation,
        ]).exec(),
        PackingList.countDocuments(filter).exec(),
    ]);

    return {
        data: packingLists,
        pagination: getPaginationMeta(page, limit, totalRecords),
    };
};

export const updateById = async (
    id: string,
    updateData: Record<string, unknown>
) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    return PackingList.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(id),
            isDeleted: false,
        },
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    ).exec();
};

export const deletePackingList = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId
) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    return PackingList.findOneAndUpdate(
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
        {
            new: true,
        }
    ).exec();
};

export const generatePackingId = async (): Promise<string> => {
    const lastPackingList = await PackingList.findOne({
        packingId: { $exists: true, $ne: null },
    })
        .sort({ createdAt: -1 })
        .select("packingId")
        .lean()
        .exec();

    let nextNumber = 1;

    if (lastPackingList?.packingId) {
        const match = lastPackingList.packingId.match(/^PACK(\d+)$/);

        if (match) {
            nextNumber = Number(match[1]) + 1;
        }
    }

    return `PACK${String(nextNumber).padStart(3, "0")}`;
};