
import mongoose from "mongoose";
import {
    createStockTransfer,
    findPurchaseEntryById,
    findQualityCheckByPurchaseEntry,
    findTransfersForPurchaseEntry,
    findAllStockTransfers,
    findStoreTransfersPaginated,
    getMainStoreStockAggregation,
    type StockTransferInput,
} from "./storeStockTransferRepository";
import { message } from "../../constants/responseMessage";

type StockTransferRequest = {
    stores: {
        storeName: string;
        products: {
            purchaseEntry: string;
            productName: string;
            qty: number;
            rate: number;
        }[];
    }[];
    transferDate?: string | Date;
};

export const createStockTransferService = async (
    data: StockTransferRequest,
) => {
    if (!Array.isArray(data.stores) || data.stores.length === 0) {
        throw new Error(message.INVALID_TRANSFER_PRODUCTS);
    }

    const validatedStores: StockTransferInput["stores"] = [];
    const requestedQuantities = new Map<string, number>();

    for (const store of data.stores) {
        if (
            !store.storeName?.trim() ||
            !Array.isArray(store.products) ||
            store.products.length === 0
        ) {
            throw new Error(message.INVALID_TRANSFER_PRODUCTS);
        }

        const validatedProducts: StockTransferInput["stores"][number]["products"] = [];

        for (const product of store.products) {
            if (
                !mongoose.isValidObjectId(product.purchaseEntry) ||
                !product.productName?.trim() ||
                !Number.isInteger(product.qty) ||
                product.qty <= 0 ||
                !Number.isFinite(product.rate) ||
                product.rate < 0
            ) {
                throw new Error(message.INVALID_TRANSFER_PRODUCTS);
            }

            const purchaseEntryId = new mongoose.Types.ObjectId(
                product.purchaseEntry,
            );

            const purchaseEntry = await findPurchaseEntryById(
                purchaseEntryId.toString(),
            );

            if (!purchaseEntry) {
                throw new Error(message.PURCHASE_ENTRY_NOT_FOUND);
            }

            const qualityCheck = await findQualityCheckByPurchaseEntry(
                purchaseEntryId,
            );

            if (!qualityCheck) {
                throw new Error(message.QUALITY_CHECK_NOT_FOUND);
            }

            const qualityProducts = (
                qualityCheck as {
                    products?: {
                        productName: string;
                        approvedQty: number;
                        purchaseRate?: number;
                    }[];
                }
            ).products ?? [];

            const qualityProduct = qualityProducts.find(
                (item) =>
                    item.productName.trim().toLowerCase() ===
                    product.productName.trim().toLowerCase(),
            );

            if (!qualityProduct) {
                throw new Error(message.INVALID_TRANSFER_PRODUCTS);
            }

            const key =
                `${purchaseEntryId.toString()}:` +
                product.productName.trim().toLowerCase();

            const previousTransfers =
                await findTransfersForPurchaseEntry(purchaseEntryId);

            let alreadyTransferred = 0;

            for (const transfer of previousTransfers) {
                for (const existingStore of transfer.stores ?? []) {
                    for (const existingProduct of existingStore.products ?? []) {
                        if (
                            existingProduct.productName.trim().toLowerCase() ===
                            product.productName.trim().toLowerCase()
                        ) {
                            alreadyTransferred +=
                                Number(existingProduct.qty) || 0;
                        }
                    }
                }
            }

            const requestedBefore = requestedQuantities.get(key) ?? 0;
            const requestedTotal = requestedBefore + product.qty;
            const availableQty =
                Number(qualityProduct.approvedQty) - alreadyTransferred;

            if (requestedTotal > availableQty) {
                throw new Error(message.INSUFFICIENT_STOCK);
            }

            requestedQuantities.set(key, requestedTotal);

            validatedProducts.push({
                purchaseEntry: purchaseEntryId,
                productName: product.productName.trim(),
                qty: product.qty,
                rate: product.rate,
            });
        }

        validatedStores.push({
            storeName: store.storeName.trim(),
            products: validatedProducts,
        });
    }

    const transferDate = data.transferDate
        ? new Date(data.transferDate)
        : new Date();

    if (Number.isNaN(transferDate.getTime())) {
        throw new Error(message.INVALID_TRANSFER_PRODUCTS);
    }

    return createStockTransfer({
        stores: validatedStores,
        transferDate,
    });
};

export const getAllStockTransfersService = async () => {
    return findAllStockTransfers();
};

export const getStoreStockService = async (
    storeName: string,
    page: number,
    limit: number,
) => {
    const normalizedStoreName = storeName.trim();

    if (!normalizedStoreName) {
        throw new Error(message.INVALID_TRANSFER_PRODUCTS);
    }

    if (
        normalizedStoreName.toUpperCase() === "TRP_MAIN_STORE"
    ) {
        return getMainStoreStockAggregation(page, limit);
    }

    return findStoreTransfersPaginated(
        normalizedStoreName,
        page,
        limit,
    );
};
