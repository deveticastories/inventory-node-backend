
import mongoose from "mongoose";
import StoreStockTransferModel from "../../models/storeStockTransferModel";
import StoreModel from "../../models/storeModel";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";

export interface StockTransferInput {
    stores: {
        storeName: string;
        products: {
            purchaseEntry: mongoose.Types.ObjectId;
            productName: string;
            qty: number;
            rate: number;
        }[];
    }[];
    transferDate?: Date;
}

export const findStoreById = async (id: string) => {
    return StoreModel.findOne({
        _id: id,
        isDeleted: false,
    }).lean();
};

export const findPurchaseEntryById = async (id: string) => {
    return PurchaseEntryModel.findOne({
        _id: id,
        isDeleted: false,
        qcStatus: "Done",
    }).lean();
};

export const findQualityCheckByPurchaseEntry = async (
    purchaseEntry: mongoose.Types.ObjectId,
) => {
    return PurchaseQualityCheckModel.findOne({
        purchaseEntry,
        isDeleted: false,
    }).lean();
};

export const findTransfersForPurchaseEntry = async (
    purchaseEntry: mongoose.Types.ObjectId,
) => {
    return StoreStockTransferModel.find({
        isDeleted: false,
        "stores.products.purchaseEntry": purchaseEntry,
    }).lean();
};

export const createStockTransfer = async (data: StockTransferInput) => {
    const stores = data.stores.map((store) => ({
        storeName: store.storeName.trim(),
        products: store.products.map((product) => ({
            purchaseEntry: product.purchaseEntry,
            productName: product.productName.trim(),
            qty: product.qty,
            rate: product.rate,
            total: product.qty * product.rate,
        })),
    }));

    const stockValue = stores.reduce(
        (storeSum, store) =>
            storeSum +
            store.products.reduce(
                (productSum, product) => productSum + product.total,
                0,
            ),
        0,
    );

    return StoreStockTransferModel.create({
        stores,
        transferDate: data.transferDate ?? new Date(),
        stockValue,
    });
};

export const findAllStockTransfers = async () => {
    return StoreStockTransferModel.find({
        isDeleted: false,
    })
        .sort({ transferDate: -1 })
        .lean();
};

export const findStoreTransfersPaginated = async (
    storeName: string,
    page: number,
    limit: number,
) => {
    const normalizedStoreName = storeName.trim().toLowerCase();

    const escapedStoreName = storeName
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filter = {
        isDeleted: false,
        "stores.storeName": {
            $regex: `^${escapedStoreName}$`,
            $options: "i",
        },
    };

    const [items, total, allTransfers] = await Promise.all([
        StoreStockTransferModel.find(filter)
            .populate({
                path: "stores.products.purchaseEntry",
                select: "invoiceNo purchaseDate vendor products totalProductQty totalAmount totalIncludingGST qcStatus",
                populate: {
                    path: "vendor",
                    select: "vendorName",
                },
            })
            .sort({ transferDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),

        StoreStockTransferModel.countDocuments(filter),

        StoreStockTransferModel.find(filter)
            .select("stores")
            .lean(),
    ]);

    let totalQuantity = 0;
    let stockValue = 0;

    for (const transfer of allTransfers) {
        for (const store of transfer.stores ?? []) {
            if (store.storeName.trim().toLowerCase() !== normalizedStoreName) {
                continue;
            }

            for (const product of store.products ?? []) {
                const qty = Number(product.qty) || 0;
                const rate = Number(product.rate) || 0;

                totalQuantity += qty;
                stockValue += qty * rate;
            }
        }
    }

    const formattedItems = items.map((transfer) => ({
        ...transfer,
        stores: (transfer.stores ?? []).map((store: { products: any; }) => ({
            ...store,
            products: (store.products ?? []).map((product: { qty: any; rate: any; }) => ({
                ...product,
                total:
                    (Number(product.qty) || 0) *
                    (Number(product.rate) || 0),
            })),
        })),
    }));

    return {
        storeName,
        totalQuantity,
        stockValue,
        items: formattedItems,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getMainStoreStockAggregation = async (
    page = 1,
    limit = 10,
) => {
    const mainStoreName = "TRP_MAIN_STORE";
    const sampleStoreName = "TRP_SAMPLE_STORE";

    const [approvedProducts, sampleTransfers] = await Promise.all([
        PurchaseEntryModel.aggregate([
            {
                $match: {
                    isDeleted: false,
                    qcStatus: "Done",
                },
            },
            {
                $lookup: {
                    from: PurchaseQualityCheckModel.collection.name,
                    localField: "_id",
                    foreignField: "purchaseEntry",
                    as: "qualityChecks",
                },
            },
            { $unwind: "$qualityChecks" },
            {
                $match: {
                    "qualityChecks.isDeleted": false,
                },
            },
            { $unwind: "$qualityChecks.products" },
            {
                $lookup: {
                    from: "vendors",
                    localField: "vendor",
                    foreignField: "_id",
                    as: "vendorDetails",
                },
            },
            {
                $unwind: {
                    path: "$vendorDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    purchaseEntry: "$_id",
                    invoiceNo: 1,
                    purchaseDate: 1,
                    productName: "$qualityChecks.products.productName",
                    vendor: "$vendorDetails.vendorName",
                    approvedQty: "$qualityChecks.products.approvedQty",
                    rate: "$qualityChecks.products.purchaseRate",
                },
            },
            {
                $sort: {
                    purchaseDate: -1,
                    productName: 1,
                },
            },
        ]),

        StoreStockTransferModel.find({
            isDeleted: false,
            "stores.storeName": {
                $regex: `^${sampleStoreName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i",
            },
        })
            .select("stores")
            .lean(),
    ]);

    const transferredQuantities = new Map<string, number>();

    for (const transfer of sampleTransfers) {
        for (const store of transfer.stores ?? []) {
            if (
                store.storeName.trim().toLowerCase() !==
                sampleStoreName.toLowerCase()
            ) {
                continue;
            }

            for (const product of store.products ?? []) {
                const key =
                    `${String(product.purchaseEntry)}:` +
                    product.productName.trim().toLowerCase();

                transferredQuantities.set(
                    key,
                    (transferredQuantities.get(key) ?? 0) +
                        (Number(product.qty) || 0),
                );
            }
        }
    }

    const availableProducts = approvedProducts
        .map((product) => {
            const key =
                `${String(product.purchaseEntry)}:` +
                String(product.productName).trim().toLowerCase();

            const approvedQty = Number(product.approvedQty) || 0;
            const transferredQty = transferredQuantities.get(key) ?? 0;
            const availableQty = Math.max(
                0,
                approvedQty - transferredQty,
            );
            const rate = Number(product.rate) || 0;

            return {
                ...product,
                approvedQty,
                transferredQty,
                availableQty,
                rate,
                total: availableQty * rate,
            };
        })
        .filter((product) => product.availableQty > 0);

    const totalQuantity = availableProducts.reduce(
        (sum, product) => sum + product.availableQty,
        0,
    );

    const stockValue = availableProducts.reduce(
        (sum, product) => sum + product.total,
        0,
    );

    const total = availableProducts.length;
    const items = availableProducts.slice(
        (page - 1) * limit,
        page * limit,
    );

    return {
        storeName: mainStoreName,
        totalQuantity,
        stockValue,
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
