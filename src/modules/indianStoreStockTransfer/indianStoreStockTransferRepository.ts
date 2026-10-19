
import mongoose from "mongoose";
import IndianStoreStockTransferModel from "../../models/indianStoreStockTransferModel";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import StoreModel from "../../models/storeModel";

export const findStoreById = (id: string) => {
    return StoreModel.findById(id).exec();
};

export const findQualityCheckProduct = async (productId: string) => {
    if (!mongoose.Types.ObjectId.isValid(productId)) return null;

    return PurchaseQualityCheckModel.findOne({
        "products._id": new mongoose.Types.ObjectId(productId),
        isDeleted: false,
    }).exec();
};

export const getAvailableQty = async (
    storeId: string,
    productId: string,
    storeType: "fromStore" | "toStore" = "fromStore",
): Promise<number> => {
 

    if (
        !mongoose.Types.ObjectId.isValid(storeId) ||
        !mongoose.Types.ObjectId.isValid(productId)
    ) {
        console.log("Invalid storeId or productId");
        return 0;
    }

    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const qualityCheck = await PurchaseQualityCheckModel.findOne({
        "products._id": productObjectId,
        isDeleted: false,
    }).exec();

    console.log("Quality check found:", !!qualityCheck);

    const qualityCheckProduct = qualityCheck?.products.find(
        (product: any) =>
            product._id?.toString() === productObjectId.toString(),
    );

    if (!qualityCheckProduct) {
        console.log("Quality check product not found");
        return 0;
    }

    const approvedQty = qualityCheckProduct.approvedQty ?? 0;

    console.log("Product name:", (qualityCheckProduct as any).productName);
    console.log("Approved quantity:", approvedQty);

    const transfers = await IndianStoreStockTransferModel.aggregate([
        {
            $match: {
                isDeleted: false,
                $or: [
                    { fromStore: storeObjectId },
                    { toStore: storeObjectId },
                ],
            },
        },
        { $unwind: "$products" },
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
                transferRecords: { $sum: 1 },
            },
        },
    ]).exec();

    console.log("Transfer aggregation result:", transfers);

    const transferredIn = transfers[0]?.transferredIn ?? 0;
    const transferredOut = transfers[0]?.transferredOut ?? 0;

    let availableQty: number;

    if (storeType === "fromStore") {
        availableQty = Math.max(0, approvedQty - transferredOut);
    } else {
        availableQty = Math.max(0, transferredIn - transferredOut);
    }


    return availableQty;
};

export const createIndianStoreStockTransfer = async (
    data: Record<string, unknown>,
) => {
    const transfer = await IndianStoreStockTransferModel.create(data);

    return IndianStoreStockTransferModel.findById(transfer._id)
        .populate("fromStore")
        .populate("toStore")
        .populate("products.qualityCheckProduct")
        .exec();
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
        {
            $lookup: {
                from: "purchasequalitychecks",
                localField: "products.qualityCheckProduct",
                foreignField: "products._id",
                as: "qualityChecks",
            },
        },
    ]).exec().then((result) => result[0] ?? null);
};

export const findAllIndianStoreStockTransfers = async (
    page: number,
    limit: number,
    search?: string,
    fromStore?: string,
    toStore?: string,
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

    if (fromStore && mongoose.Types.ObjectId.isValid(fromStore)) {
        filter.fromStore = new mongoose.Types.ObjectId(fromStore);
    }

    if (toStore && mongoose.Types.ObjectId.isValid(toStore)) {
        filter.toStore = new mongoose.Types.ObjectId(toStore);
    }

    const [data, totalRecords] = await Promise.all([
        IndianStoreStockTransferModel.find(filter)
            .populate("fromStore")
            .populate("toStore")
            .populate("products.qualityCheckProduct")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        IndianStoreStockTransferModel.countDocuments(filter),
    ]);

    return { data, totalRecords };
};
export const getQualityCheckProducts = async () => {
    const qualityChecks = await PurchaseQualityCheckModel.find({
        isDeleted: false,
    })
        .populate({
            path: "purchaseEntry",
            populate: {
                path: "vendor",
            },
        })
        .lean()
        .exec();

    return qualityChecks.flatMap((qualityCheck: any) =>
        (qualityCheck.products ?? []).map((product: any) => {
            const purchaseEntry = qualityCheck.purchaseEntry as any;

            return {
                ...product,
                qualityCheckProduct: {
                    ...product,
                    purchaseDate: purchaseEntry?.purchaseDate ?? null,
                    invoiceNo: purchaseEntry?.invoiceNo ?? null,
                    vendor: purchaseEntry?.vendor ?? null,
                },
                productName: product.productName,
                rate: product.purchaseRate,
                purchaseRate: product.purchaseRate,
                approvedQty: product.approvedQty,
                availableQtyAfterQC: product.availableQtyAfterQC,
            };
        }),
    );
};
export const getTransferredProductsForStore = async (
    storeId: string,
) => {
    const transfers = await IndianStoreStockTransferModel.aggregate([
        {
            $match: {
                toStore: new mongoose.Types.ObjectId(storeId),
                isDeleted: false,
            },
        },
        { $unwind: "$products" },
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
        {
            $lookup: {
                from: "purchasequalitychecks",
                let: { productId: "$_id" },
                pipeline: [
                    { $match: { isDeleted: false } },
                    { $unwind: "$products" },
                    {
                        $match: {
                            $expr: {
                                $eq: ["$products._id", "$$productId"],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "purchaseentries",
                            localField: "purchaseEntry",
                            foreignField: "_id",
                            as: "purchaseEntry",
                        },
                    },
                    {
                        $unwind: {
                            path: "$purchaseEntry",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: "vendors",
                            localField: "purchaseEntry.vendor",
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
                            _id: "$products._id",
                            productName: "$products.productName",
                            totalQty: "$products.totalQty",
                            purchaseRate: "$products.purchaseRate",
                            damageQty: "$products.damageQty",
                            approvedQty: "$products.approvedQty",
                            availableQtyAfterQC: "$products.availableQtyAfterQC",
                            purchaseDate: "$purchaseEntry.purchaseDate",
                            invoiceNo: "$purchaseEntry.invoiceNo",
                            vendor: "$vendor",
                        },
                    },
                ],
                as: "qualityCheckProduct",
            },
        },
        {
            $unwind: {
                path: "$qualityCheckProduct",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 1,
                qualityCheckProduct: "$qualityCheckProduct",
                productName: "$qualityCheckProduct.productName",
                rate: "$qualityCheckProduct.purchaseRate",
                transferredQty: 1,
            },
        },
    ]).exec();

    return transfers;
};