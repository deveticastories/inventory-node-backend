import mongoose from "mongoose";
import {
    findStoreById,
    getSampleQtyByProduct,
    createIndianStoreStockTransfer,
    findIndianStoreStockTransferById,
    findAllIndianStoreStockTransfers,
} from "./indianStoreStockTransferRepository";
import {
    filterAndSortStockLines,
    getMainStockLines,
    type StockSort,
} from "../stock/stockService";

const STOCK_SORTS: StockSort[] = ["date", "vendor", "product"];

const toStockSort = (sortBy?: string): StockSort =>
    STOCK_SORTS.includes(sortBy as StockSort) ? (sortBy as StockSort) : "date";

const getIndianStore = async (storeId: string) => {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
        throw new Error("STORE_ID_INVALID");
    }

    const store = await findStoreById(storeId);

    if (!store) {
        throw new Error("STORE_NOT_FOUND");
    }

    if (store.location !== "IND") {
        throw new Error("STORE_NOT_IND");
    }

    return store;
};

/** TRP_MAIN STORE: QC-approved stock still available. */
export const getMainStoreStock = async (search?: string, sortBy?: string) => {
    const lines = filterAndSortStockLines(
        await getMainStockLines(),
        search,
        toStockSort(sortBy),
    );

    return {
        summary: {
            stockVolume: lines.reduce((total, line) => total + line.availableQty, 0),
            stockValue: lines.reduce(
                (total, line) => total + line.availableQty * line.rate,
                0,
            ),
        },
        data: lines,
    };
};

/** TRP_SAMPLE STORE: stock reaches it only by transfer from TRP_MAIN STORE. */
export const getSampleStoreStock = async (
    search?: string,
    sortBy?: string,
    storeId?: string,
) => {
    if (storeId) {
        await getIndianStore(storeId);
    }

    const [mainLines, sampleRows] = await Promise.all([
        getMainStockLines(),
        getSampleQtyByProduct(storeId),
    ]);

    const sampleQty = new Map(
        sampleRows.map((row) => [row._id.toString(), row.qty]),
    );

    const lines = filterAndSortStockLines(
        mainLines
            .filter((line) =>
                (sampleQty.get(line.qualityCheckProduct.toString()) ?? 0) > 0,
            )
            .map((line) => ({
                ...line,
                sampleQty:
                    sampleQty.get(line.qualityCheckProduct.toString()) ?? 0,
            })),
        search,
        toStockSort(sortBy),
    );

    return {
        summary: {
            stockVolume: lines.reduce((total, line) => total + line.sampleQty, 0),
            stockValue: lines.reduce(
                (total, line) => total + line.sampleQty * line.rate,
                0,
            ),
        },
        data: lines,
    };
};

/**
 * Products for the transfer dialog: storeType "fromStore" lists TRP_MAIN
 * STORE lines that still have stock, "toStore" lists what the store holds.
 */
export const getIndianStoreStockTransferProducts = async (
    storeId: string,
    storeType: "fromStore" | "toStore",
) => {
    if (storeType !== "fromStore" && storeType !== "toStore") {
        throw new Error("STORE_TYPE_INVALID");
    }

    await getIndianStore(storeId);

    if (storeType === "toStore") {
        return (await getSampleStoreStock(undefined, undefined, storeId)).data;
    }

    return (await getMainStockLines())
        .filter((line) => line.availableQty > 0)
        .map((line) => ({
            ...line,
            availableQtyAfterTransfer: line.availableQty,
        }));
};

export const getAllIndianStoreStockTransfers = async (
    page: number,
    limit: number,
    search?: string,
    fromStore?: string,
    toStore?: string,
) => {
    if (fromStore && toStore) {
        throw new Error("ONLY_ONE_STORE_FILTER_ALLOWED");
    }

    const storeId = fromStore ?? toStore;

    if (storeId) {
        await getIndianStore(storeId);
    }

    return findAllIndianStoreStockTransfers(
        page,
        limit,
        search,
        fromStore,
        toStore,
    );
};

interface CreateIndianStoreStockTransferInput {
    fromStore: string;
    toStore: string;
    transferDate?: Date;
    products: {
        qualityCheckProduct: string;
        qty: number;
    }[];
}

export const createIndianStoreStockTransferService = async (
    data: CreateIndianStoreStockTransferInput,
) => {
    if (
        !mongoose.Types.ObjectId.isValid(data.fromStore) ||
        !mongoose.Types.ObjectId.isValid(data.toStore)
    ) {
        throw new Error("STORE_ID_INVALID");
    }

    if (data.fromStore === data.toStore) {
        throw new Error("STORES_MUST_BE_DIFFERENT");
    }

    if (!data.products?.length) {
        throw new Error("TRANSFER_PRODUCTS_REQUIRED");
    }

    await Promise.all([
        getIndianStore(data.fromStore),
        getIndianStore(data.toStore),
    ]);

    const mainLines = await getMainStockLines();
    const seenProducts = new Set<string>();

    const products = data.products.map((item) => {
        if (!mongoose.Types.ObjectId.isValid(item.qualityCheckProduct)) {
            throw new Error("QUALITY_CHECK_PRODUCT_ID_INVALID");
        }

        if (!Number.isInteger(item.qty) || item.qty <= 0) {
            throw new Error("TRANSFER_QUANTITY_INVALID");
        }

        const productId = item.qualityCheckProduct.toString();

        if (seenProducts.has(productId)) {
            throw new Error("DUPLICATE_TRANSFER_PRODUCT");
        }

        seenProducts.add(productId);

        const line = mainLines.find(
            (stockLine) =>
                stockLine.qualityCheckProduct.toString() === productId,
        );

        if (!line) {
            throw new Error("QUALITY_CHECK_PRODUCT_NOT_FOUND");
        }

        if (item.qty > line.availableQty) {
            throw new Error("INSUFFICIENT_STORE_STOCK");
        }

        return {
            qualityCheckProduct: line.qualityCheckProduct,
            productName: line.productName,
            transferredQty: item.qty,
            availableQty: line.availableQty - item.qty,
            rate: line.rate,
            total: item.qty * line.rate,
        };
    });

    return createIndianStoreStockTransfer({
        fromStore: new mongoose.Types.ObjectId(data.fromStore),
        toStore: new mongoose.Types.ObjectId(data.toStore),
        transferDate: data.transferDate ?? new Date(),
        products,
    });
};

export const getIndianStoreStockTransferById = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("INDIAN_STORE_STOCK_TRANSFER_ID_INVALID");
    }

    const transfer = await findIndianStoreStockTransferById(id);

    if (!transfer) {
        throw new Error("INDIAN_STORE_STOCK_TRANSFER_NOT_FOUND");
    }

    return transfer;
};
