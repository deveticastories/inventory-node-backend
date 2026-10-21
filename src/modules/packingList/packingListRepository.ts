
import mongoose from "mongoose";
import PackingListModel, {
    type PackingListStatus,
} from "../../models/packingListModel";
import { getPaginationMeta } from "../../utils/pagination";
interface TransitUpdate {
    styleId: string;
    transit: {
        perPcAED: number;
        expenseRecAED: number;
        updatedUnitRateAED: number;
    };
}
const packingListLookups = [
    {
        $lookup: {
            from: "indianstorestocktransfers",
            localField: "styles.indianStoreStockTransfer",
            foreignField: "_id",
            as: "transferDetails",
        },
    },
    {
        $set: {
            styles: {
                $map: {
                    input: "$styles",
                    as: "style",
                    in: {
                        $let: {
                            vars: {
                                transfer: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$transferDetails",
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
                                $mergeObjects: [
                                    "$$style",
                                    {
                                        indianStoreStockTransfer: {
                                            $ifNull: [
                                                "$$transfer",
                                                "$$style.indianStoreStockTransfer",
                                            ],
                                        },
                                        indianStoreStockTransferProduct: {
                                            $let: {
                                                vars: {
                                                    product: {
                                                        $arrayElemAt: [
                                                            {
                                                                $filter: {
                                                                    input: {
                                                                        $ifNull: [
                                                                            "$$transfer.products",
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
                                                    $ifNull: [
                                                        "$$product",
                                                        "$$style.indianStoreStockTransferProduct",
                                                    ],
                                                },
                                            },
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
    {
        $lookup: {
            from: "dailyexpenses",
            localField: "dailyExpenses",
            foreignField: "_id",
            as: "dailyExpenses",
        },
    },
    {
        $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByDetails",
        },
    },
    {
        $lookup: {
            from: "users",
            localField: "updatedBy",
            foreignField: "_id",
            as: "updatedByDetails",
        },
    },
    {
        $lookup: {
            from: "users",
            localField: "deletedBy",
            foreignField: "_id",
            as: "deletedByDetails",
        },
    },
    {
        $set: {
            createdBy: {
                $ifNull: [
                    { $arrayElemAt: ["$createdByDetails", 0] },
                    "$createdBy",
                ],
            },
            updatedBy: {
                $ifNull: [
                    { $arrayElemAt: ["$updatedByDetails", 0] },
                    "$updatedBy",
                ],
            },
            deletedBy: {
                $ifNull: [
                    { $arrayElemAt: ["$deletedByDetails", 0] },
                    "$deletedBy",
                ],
            },
            totalExpense: {
                $sum: "$dailyExpenses.amount",
            },
        },
    },
    {
        $unset: [
            "transferDetails",
            "createdByDetails",
            "updatedByDetails",
            "deletedByDetails",
        ],
    },
];

export const create = async (
    packingListData: Record<string, unknown>,
) => {
    const packingList = new PackingListModel(packingListData);
    return packingList.save();
};

export const getAllPackingLists = async (
    page: number,
    limit: number,
    status?: PackingListStatus,
) => {
    const filter: Record<string, unknown> = {
        isDeleted: false,
    };

    if (status) {
        filter.packingListStatus = status;
    }

    const skip = (page - 1) * limit;

    const [packingLists, totalRecords] = await Promise.all([
        PackingListModel.aggregate([
            { $match: filter },
            { $sort: { packingDate: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            ...packingListLookups,
        ]).exec(),
        PackingListModel.countDocuments(filter).exec(),
    ]);

    return {
        data: packingLists,
        pagination: getPaginationMeta(page, limit, totalRecords),
    };
};

export const findById = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    const packingLists = await PackingListModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                isDeleted: false,
            },
        },
        ...packingListLookups,
    ]).exec();

    return packingLists[0] ?? null;
};

export const updateById = async (
    id: string,
    updateData: Record<string, unknown>,
) => {
    return PackingListModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true },
    ).exec();
};

export const deletePackingList = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    return PackingListModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
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

const PACKING_ID_PREFIX = "PK-";
const PACKING_ID_PADDING = 4;

export const generatePackingId = async (): Promise<string> => {
    const lastPackingList = await PackingListModel.findOne({
        packingId: { $regex: /^PK-\d+$/ },
    })
        .sort({ packingId: -1 })
        .collation({ locale: "en", numericOrdering: true })
        .select("packingId")
        .lean()
        .exec();

    const lastNumber = lastPackingList?.packingId
        ? parseInt(
            lastPackingList.packingId.slice(
                PACKING_ID_PREFIX.length,
            ),
            10,
        )
        : 0;

    return `${PACKING_ID_PREFIX}${String(
        lastNumber + 1,
    ).padStart(PACKING_ID_PADDING, "0")}`;
};
export const updateStylesTransit = async (
    updates: TransitUpdate[],
    updatedBy: mongoose.Types.ObjectId,
) => {
    const now = new Date();

    const operations = updates.map(({ styleId, transit }) => ({
        updateOne: {
            filter: {
                isDeleted: false,
                "styles._id": new mongoose.Types.ObjectId(styleId),
            },
            update: {
                $set: {
                    "styles.$[style].transit": transit,
                    updatedBy,
                    userUpdatedDate: now,
                },
            },
            arrayFilters: [
                {
                    "style._id": new mongoose.Types.ObjectId(styleId),
                },
            ],
        },
    }));

    return PackingListModel.bulkWrite(operations);
};
export const findStylesByIds = async (styleIds: string[]) => {
    const objectIds = styleIds.map(
        (id) => new mongoose.Types.ObjectId(id),
    );

    return PackingListModel.aggregate([
        {
            $match: {
                isDeleted: false,
                "styles._id": { $in: objectIds },
            },
        },
        {
            $unwind: "$styles",
        },
        {
            $match: {
                "styles._id": { $in: objectIds },
            },
        },
        {
            $project: {
                _id: 0,
                styleId: "$styles._id",
            },
        },
    ]);
};

export const updatePackingListsStatus = async (
    packingListIds: string[],
    packingListStatus: PackingListStatus,
    updatedBy: mongoose.Types.ObjectId,
) => {
    const objectIds = packingListIds.map(
        (id) => new mongoose.Types.ObjectId(id),
    );

    return PackingListModel.updateMany(
        {
            _id: { $in: objectIds },
            isDeleted: false,
        },
        {
            $set: {
                packingListStatus,
                updatedBy,
                userUpdatedDate: new Date(),
            },
        },
    );
};