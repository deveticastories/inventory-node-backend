
import mongoose from "mongoose";
import IndianStoreStockTransferModel from "../../models/indianStoreStockTransferModel";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import StoreModel from "../../models/storeModel";

export const findStoreById = (id: string) => {
    return StoreModel.findById(id).exec();
};

export const findQualityCheckProduct = (productId: string) => {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return Promise.resolve(null);
    }

    return PurchaseQualityCheckModel.findOne({
        "products._id": new mongoose.Types.ObjectId(productId),
        isDeleted: false,
    }).exec();
};

export const getAvailableQty = async (
    storeId: string,
    productId: string,
): Promise<number> => {
    if (
        !mongoose.Types.ObjectId.isValid(storeId) ||
        !mongoose.Types.ObjectId.isValid(productId)
    ) {
        return 0;
    }

    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const qualityCheck = await PurchaseQualityCheckModel.findOne({
        "products._id": productObjectId,
        isDeleted: false,
    }).exec();

    const qualityCheckProduct = qualityCheck?.products.find(
        (product: { _id: { toString: () => string } }) =>
            product._id?.toString() === productId,
    );

    if (!qualityCheckProduct) {
        return 0;
    }

    const result = await IndianStoreStockTransferModel.aggregate([
        {
            $match: {
                isDeleted: false,
                $or: [
                    { fromStore: storeObjectId },
                    { toStore: storeObjectId },
                ],
            },
        },
        {
            $unwind: "$products",
        },
        {
            $match: {
                "products.qualityCheckProduct": productObjectId,
            },
        },
        {
            $group: {
                _id: null,
                transferredIn: {
                    $sum: {
                        $cond: [
                            { $eq: ["$toStore", storeObjectId] },
                            {
                                $ifNull: [
                                    "$products.transferredQty",
                                    "$products.qty",
                                ],
                            },
                            0,
                        ],
                    },
                },
                transferredOut: {
                    $sum: {
                        $cond: [
                            { $eq: ["$fromStore", storeObjectId] },
                            {
                                $ifNull: [
                                    "$products.transferredQty",
                                    "$products.qty",
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
        },
    ]).exec();

    const transferredIn = result[0]?.transferredIn ?? 0;
    const transferredOut = result[0]?.transferredOut ?? 0;

    if (transferredIn === 0 && transferredOut === 0) {
        return qualityCheckProduct.approvedQty ?? 0;
    }

    return Math.max(0, transferredIn - transferredOut);
};

export const createIndianStoreStockTransfer = async (
    data: Record<string, unknown>
) => {
    const transfer = await IndianStoreStockTransferModel.create(data);

    return IndianStoreStockTransferModel.findById(transfer._id)
        .populate("fromStore")
        .populate("toStore")
        .populate("products.qualityCheckProduct");
};
export const findIndianStoreStockTransferById = (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return Promise.resolve(null);
    }

    return IndianStoreStockTransferModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: "stores",
                localField: "fromStore",
                foreignField: "_id",
                as: "fromStore",
            },
        },
        {
            $unwind: {
                path: "$fromStore",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "stores",
                localField: "toStore",
                foreignField: "_id",
                as: "toStore",
            },
        },
        {
            $unwind: {
                path: "$toStore",
                preserveNullAndEmptyArrays: true,
            },
        },
    ]).exec().then((result) => result[0] ?? null);
};

export const findAllIndianStoreStockTransfers = async (
    page: number,
    limit: number,
    search?: string
) => {
    const filter: Record<string, unknown> = {
        isDeleted: false,
    };

    if (search) {
        filter["products.productName"] = {
            $regex: search,
            $options: "i",
        };
    }

    const [data, totalRecords] = await Promise.all([
        IndianStoreStockTransferModel.find(filter)
            .populate("fromStore")
            .populate("toStore")
            .populate("products.qualityCheckProduct")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        IndianStoreStockTransferModel.countDocuments(filter),
    ]);

    return { data, totalRecords };
};

export const getQualityCheckProducts = () => {
    return PurchaseQualityCheckModel.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: "$products" },
        {
            $project: {
                _id: "$products._id",
                productName: "$products.productName",
                approvedQty: "$products.approvedQty",
                purchaseRate: "$products.purchaseRate",
                availableQtyAfterQC: "$products.availableQtyAfterQC",
                purchaseEntry: 1,
            },
        },
    ]).exec();
};


export const getTransferredProductsForStore = async (
    storeId: string,
) => {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
        return [];
    }

    const storeObjectId = new mongoose.Types.ObjectId(storeId);

    const transfers = await IndianStoreStockTransferModel.aggregate([
        {
            $match: {
                toStore: storeObjectId,
                isDeleted: false,
            },
        },
        {
            $unwind: "$products",
        },
        {
            $group: {
                _id: "$products.qualityCheckProduct",
                transferredQty: {
                    $sum: {
                        $ifNull: [
                            "$products.transferredQty",
                            "$products.qty",
                        ],
                    },
                },
            },
        },
    ]).exec();

    const populatedProducts = await Promise.all(
        transfers.map(async (transfer) => {
            const qualityCheck = await PurchaseQualityCheckModel
                .findOne(
                    {
                        "products._id": transfer._id,
                        isDeleted: false,
                    },
                    {
                        purchaseEntry: 1,
                        products: {
                            $elemMatch: {
                                _id: transfer._id,
                            },
                        },
                    },
                )
                .populate({
                    path: "purchaseEntry",
                    populate: {
                        path: "vendor",
                    },
                })
                .lean()
                .exec();

            const qualityCheckProduct = qualityCheck?.products?.[0];

            if (!qualityCheckProduct) {
                return null;
            }

            const purchaseEntry = qualityCheck?.purchaseEntry as any;

            return {
                qualityCheckProduct: {
                    ...qualityCheckProduct,
                    vendor: purchaseEntry?.vendor ?? null,
                },
                transferredQty: transfer.transferredQty,
            };
        }),
    );

    return populatedProducts.filter(
        (product) => product !== null,
    );
};
