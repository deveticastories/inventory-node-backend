
import mongoose from "mongoose";
import PackingList from "../../models/packingListModel";
import { getPaginationMeta } from "../../utils/pagination";

const packingListAggregation = [
    {
        $lookup: {
            from: "vendors",
            localField: "styles.vendorName",
            foreignField: "_id",
            as: "vendors",
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
                        $mergeObjects: [
                            "$$style",
                            {
                                vendorName: {
                                    $ifNull: [
                                        {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$vendors",
                                                        as: "vendor",
                                                        cond: {
                                                            $eq: [
                                                                "$$vendor._id",
                                                                "$$style.vendorName",
                                                            ],
                                                        },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                        "$$style.vendorName",
                                    ],
                                },
                            },
                        ],
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
            vendors: 0,
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
    return PackingList.findOneAndUpdate(
        {
            _id: id,
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
    return PackingList.findOneAndUpdate(
        {
            _id: id,
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
