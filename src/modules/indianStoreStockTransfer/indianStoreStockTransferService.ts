
import mongoose from "mongoose";
import {
    findStoreById,
    findQualityCheckProduct,
    getTransferredProductsForStore,
    getAvailableQty,
    createIndianStoreStockTransfer,
    findIndianStoreStockTransferById,
    findAllIndianStoreStockTransfers,
    getQualityCheckProducts,
} from "./indianStoreStockTransferRepository";

const getQualityCheckProductId = (product: any): string => {
    const qualityCheckProduct = product.qualityCheckProduct;

    if (
        qualityCheckProduct &&
        typeof qualityCheckProduct === "object" &&
        "_id" in qualityCheckProduct
    ) {
        return qualityCheckProduct._id?.toString() ?? "";
    }

    if (qualityCheckProduct) {
        return qualityCheckProduct.toString();
    }

    return product._id?.toString() ?? "";
};

const getPopulatedQualityCheckProduct = (product: any) => {
    const qualityCheckProduct = product.qualityCheckProduct;

    if (
        qualityCheckProduct &&
        typeof qualityCheckProduct === "object" &&
        "_id" in qualityCheckProduct
    ) {
        return qualityCheckProduct;
    }

    return null;
};

export const getIndianStoreStockTransferProducts = async (
    storeId: string,
    storeType: "fromStore" | "toStore",
) => {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
        throw new Error("STORE_ID_INVALID");
    }

    if (!["fromStore", "toStore"].includes(storeType)) {
        throw new Error("STORE_TYPE_INVALID");
    }

    const store = await findStoreById(storeId);

    if (!store || store.isDeleted) {
        throw new Error("STORE_NOT_FOUND");
    }

    const records =
        storeType === "fromStore"
            ? await getQualityCheckProducts()
            : await getTransferredProductsForStore(storeId);

    const products = [];

    for (const product of records) {
        const productId = getQualityCheckProductId(product);

        if (
            !productId ||
            !mongoose.Types.ObjectId.isValid(productId)
        ) {
            continue;
        }

        const availableQty = await getAvailableQty(
            storeId,
            productId,
        );

        if (storeType === "fromStore" && availableQty <= 0) {
            continue;
        }

        if (
            storeType === "toStore" &&
            !("transferredQty" in product)
        ) {
            continue;
        }

        const populatedProduct =
            getPopulatedQualityCheckProduct(product);

        products.push({
            qualityCheckProduct:
                storeType === "toStore" && populatedProduct
                    ? populatedProduct
                    : productId,
            productName:
                populatedProduct?.productName ??
                product.productName,
            rate:
                populatedProduct?.purchaseRate ??
                ("rate" in product
                    ? product.rate
                    : product.purchaseRate),
            ...(storeType === "toStore" &&
                "transferredQty" in product
                ? { transferredQty: product.transferredQty }
                : {}),
            availableQtyAfterTransfer: availableQty,
        });
    }

    return products;
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

    const [fromStore, toStore] = await Promise.all([
        findStoreById(data.fromStore),
        findStoreById(data.toStore),
    ]);

    if (
        !fromStore ||
        !toStore ||
        fromStore.isDeleted ||
        toStore.isDeleted
    ) {
        throw new Error("STORE_NOT_FOUND");
    }

    const seenProducts = new Set<string>();

    const products: {
        qualityCheckProduct: mongoose.Types.ObjectId;
        productName: string;
        transferredQty: number;
        availableQty: number;
        rate: number;
        total: number;
    }[] = [];

    for (const item of data.products) {
        if (
            !mongoose.Types.ObjectId.isValid(
                item.qualityCheckProduct,
            )
        ) {
            throw new Error("QUALITY_CHECK_PRODUCT_ID_INVALID");
        }

        if (!Number.isInteger(item.qty) || item.qty <= 0) {
            throw new Error("TRANSFER_QUANTITY_INVALID");
        }

        const productId = new mongoose.Types.ObjectId(
            item.qualityCheckProduct,
        ).toString();

        if (seenProducts.has(productId)) {
            throw new Error("DUPLICATE_TRANSFER_PRODUCT");
        }

        seenProducts.add(productId);

        const qualityCheck = await findQualityCheckProduct(
            productId,
        );

        const qualityCheckProduct = qualityCheck?.products.find(
            (product: any) =>
                product._id?.toString() === productId,
        );

        if (!qualityCheckProduct) {
            throw new Error("QUALITY_CHECK_PRODUCT_NOT_FOUND");
        }

        const availableQty = await getAvailableQty(
            data.fromStore,
            productId,
        );

        if (item.qty > availableQty) {
            throw new Error("INSUFFICIENT_STORE_STOCK");
        }

        products.push({
            qualityCheckProduct: new mongoose.Types.ObjectId(
                productId,
            ),
            productName: qualityCheckProduct.productName,
            transferredQty: item.qty,
            availableQty: availableQty - item.qty,
            rate: qualityCheckProduct.purchaseRate,
            total:
                item.qty * qualityCheckProduct.purchaseRate,
        });
    }

    return createIndianStoreStockTransfer({
        fromStore: new mongoose.Types.ObjectId(data.fromStore),
        toStore: new mongoose.Types.ObjectId(data.toStore),
        transferDate: data.transferDate ?? new Date(),
        products,
        stockValue: products.reduce(
            (sum, product) => sum + product.total,
            0,
        ),
    });
};

export const getIndianStoreStockTransferById = async (
    id: string,
) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(
            "INDIAN_STORE_STOCK_TRANSFER_ID_INVALID",
        );
    }

    const transfer =
        await findIndianStoreStockTransferById(id);

    if (!transfer) {
        throw new Error(
            "INDIAN_STORE_STOCK_TRANSFER_NOT_FOUND",
        );
    }

    return transfer;
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
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            throw new Error("STORE_ID_INVALID");
        }

        const store = await findStoreById(storeId);

        if (!store || store.isDeleted) {
            throw new Error("STORE_NOT_FOUND");
        }

        const storeType = fromStore
            ? "fromStore"
            : "toStore";

        const records =
            storeType === "fromStore"
                ? await getQualityCheckProducts()
                : await getTransferredProductsForStore(storeId);

        const filteredProducts = [];

        for (const product of records) {
            const productId = getQualityCheckProductId(product);

            if (
                !productId ||
                !mongoose.Types.ObjectId.isValid(productId)
            ) {
                continue;
            }

            const populatedProduct =
                getPopulatedQualityCheckProduct(product);

            const productName =
                populatedProduct?.productName ??
                product.productName ??
                "";

            if (
                search?.trim() &&
                !productName
                    .toLowerCase()
                    .includes(search.trim().toLowerCase())
            ) {
                continue;
            }

            const availableQty = await getAvailableQty(
                storeId,
                productId,
            );

            if (
                storeType === "fromStore" &&
                availableQty <= 0
            ) {
                continue;
            }

            if (
                storeType === "toStore" &&
                !("transferredQty" in product)
            ) {
                continue;
            }

            filteredProducts.push({
                qualityCheckProduct:
                    storeType === "toStore" && populatedProduct
                        ? populatedProduct
                        : productId,
                productName,
                rate:
                    populatedProduct?.purchaseRate ??
                    ("rate" in product
                        ? product.rate
                        : product.purchaseRate),
                ...(storeType === "toStore" &&
                    "transferredQty" in product
                    ? {
                        transferredQty:
                            product.transferredQty,
                    }
                    : {}),
                availableQtyAfterTransfer: availableQty,
            });
        }

        const skip = (page - 1) * limit;

        return {
            data: filteredProducts.slice(
                skip,
                skip + limit,
            ),
            totalRecords: filteredProducts.length,
        };
    }

    return findAllIndianStoreStockTransfers(
        page,
        limit,
        search,
    );
};
