import mongoose from "mongoose";
import * as uaeStoreStockTransferRepo from "./uaeStoreStockTransferRepository";
import PackingListModel from "../../models/packingListModel";
import StoreModel from "../../models/storeModel";
import type {
    UAEStoreStockTransfer,
    UAEStoreStockReturnProduct,
} from "../../models/uaeStoreStockTransferModel";
import {
    getPaginationParams,
    getPaginationMeta,
} from "../../utils/pagination";
import { paginatedResponse } from "../../utils/response";

const isValidObjectId = (value: unknown): boolean =>
    (typeof value === "string" ||
        value instanceof mongoose.Types.ObjectId) &&
    mongoose.Types.ObjectId.isValid(value);

const validateNonNegativeNumber = (
    value: unknown,
    errorCode: string,
): void => {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
    ) {
        throw new Error(errorCode);
    }
};

const validateReturnData = async (
    data: Partial<UAEStoreStockTransfer>,
) => {
    if (!isValidObjectId(data.packingList)) {
        throw new Error("PACKING_LIST_ID_INVALID");
    }

    const packingList = await PackingListModel.findOne({
        _id: data.packingList,
        isDeleted: false,
    });

    if (!packingList) {
        throw new Error("PACKING_LIST_NOT_FOUND");
    }

    if (!isValidObjectId(data.fromStore)) {
        throw new Error("FROM_STORE_ID_INVALID");
    }

    if (!isValidObjectId(data.toStore)) {
        throw new Error("TO_STORE_ID_INVALID");
    }

    if (
        data.fromStore!.toString() === data.toStore!.toString()
    ) {
        throw new Error("FROM_STORE_TO_STORE_SAME");
    }

    const [fromStore, toStore] = await Promise.all([
        StoreModel.findOne({
            _id: data.fromStore,
            isDeleted: false,
        }),
        StoreModel.findOne({
            _id: data.toStore,
            isDeleted: false,
        }),
    ]);

    if (!fromStore) {
        throw new Error("FROM_STORE_NOT_FOUND");
    }

    if (!toStore) {
        throw new Error("TO_STORE_NOT_FOUND");
    }

    if (!["Fully", "Partially"].includes(String(data.returnType))) {
        throw new Error("RETURN_TYPE_INVALID");
    }

    if (
        !["Damage", "Size issue", "Other"].includes(String(data.reason))
    ) {
        throw new Error("RETURN_REASON_INVALID");
    }

    if (
        !data.returnDate ||
        Number.isNaN(new Date(data.returnDate).getTime())
    ) {
        throw new Error("RETURN_DATE_INVALID");
    }

    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error("RETURN_PRODUCTS_REQUIRED");
    }

    for (const product of data.products as UAEStoreStockReturnProduct[]) {
        if (
            !isValidObjectId(product.packingList) ||
            !isValidObjectId(product.packingStyle) ||
            !Number.isInteger(product.returnedQty) ||
            product.returnedQty < 1 ||
            typeof product.styleNo !== "string" ||
            !product.styleNo.trim() ||
            typeof product.productName !== "string" ||
            !product.productName.trim() ||
            typeof product.invoiceNo !== "string" ||
            !product.invoiceNo.trim()
        ) {
            throw new Error("RETURN_PRODUCT_INVALID");
        }

        if (
            product.packingList.toString() !==
            data.packingList!.toString()
        ) {
            throw new Error("RETURN_PRODUCT_PACKING_LIST_MISMATCH");
        }

        validateNonNegativeNumber(
            product.invoiceValue,
            "INVOICE_VALUE_INVALID",
        );
        validateNonNegativeNumber(
            product.updatedInvoiceValue,
            "UPDATED_INVOICE_VALUE_INVALID",
        );
        validateNonNegativeNumber(product.inStore, "IN_STORE_INVALID");

        const packingStyle = packingList.styles.find(
            (style: { _id?: mongoose.Types.ObjectId }) =>
                style._id?.toString() === product.packingStyle.toString(),
        );

        if (!packingStyle) {
            throw new Error("PACKING_STYLE_NOT_FOUND");
        }

        if (
            !Number.isFinite(packingStyle.qty) ||
            product.returnedQty > packingStyle.qty
        ) {
            throw new Error("RETURNED_QTY_INVALID");
        }
    }
};

export const createUAEStoreStockTransferService = async (
    data: Partial<UAEStoreStockTransfer>,
) => {
    await validateReturnData(data);
    return uaeStoreStockTransferRepo.createUAEStoreStockTransfer(data);
};

export const getAllUAEStoreStockTransfersService = async (
    query: { page?: unknown; limit?: unknown },
    packingList?: string,
    fromStore?: string,
    toStore?: string,
) => {
    const { page, limit } = getPaginationParams(query);

    for (const id of [packingList, fromStore, toStore]) {
        if (id && !mongoose.Types.ObjectId.isValid(id)) {
            if (id === packingList) {
                throw new Error("PACKING_LIST_ID_INVALID");
            }
            if (id === fromStore) {
                throw new Error("FROM_STORE_ID_INVALID");
            }
            throw new Error("TO_STORE_ID_INVALID");
        }
    }

    if (fromStore && toStore && fromStore === toStore) {
        throw new Error("FROM_STORE_TO_STORE_SAME");
    }

    const { data, totalRecords } =
        await uaeStoreStockTransferRepo.findAllUAEStoreStockTransfers(
            page,
            limit,
            packingList,
            fromStore,
            toStore,
        );

    return paginatedResponse(
        data,
        getPaginationMeta(page, limit, totalRecords),
    );
};

export const getAvailablePackingListsForFromStoreService = async (
    query: { page?: unknown; limit?: unknown },
) => {
    const { page, limit } = getPaginationParams(query);

    const { data, totalRecords } =
        await uaeStoreStockTransferRepo.findAvailablePackingListsForFromStore(
            page,
            limit,
        );

    return paginatedResponse(
        data,
        getPaginationMeta(page, limit, totalRecords),
    );
};

export const getReturnedPackingListsForToStoreService = async (
    toStore: string,
    query: { page?: unknown; limit?: unknown },
) => {
    const { page, limit } = getPaginationParams(query);

    const { data, totalRecords } =
        await uaeStoreStockTransferRepo.findReturnedPackingListsForToStore(
            toStore,
            page,
            limit,
        );

    return paginatedResponse(
        data,
        getPaginationMeta(page, limit, totalRecords),
    );
};

export const getUAEStoreStockTransferByIdService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("UAE_RETURN_ID_INVALID");
    }

    const transfer =
        await uaeStoreStockTransferRepo.findUAEStoreStockTransferById(id);

    if (!transfer) {
        throw new Error("UAE_RETURN_NOT_FOUND");
    }

    return transfer;
};

export const updateUAEStoreStockTransferService = async (
    id: string,
    data: Partial<UAEStoreStockTransfer>,
) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("UAE_RETURN_ID_INVALID");
    }

    const existing =
        await uaeStoreStockTransferRepo.findUAEStoreStockTransferById(id);

    if (!existing) {
        throw new Error("UAE_RETURN_NOT_FOUND");
    }

    const updatedData: Partial<UAEStoreStockTransfer> = {
        packingList: data.packingList ?? existing.packingList,
        fromStore: data.fromStore ?? existing.fromStore,
        toStore: data.toStore ?? existing.toStore,
        returnType: data.returnType ?? existing.returnType,
        reason: data.reason ?? existing.reason,
        products: data.products ?? existing.products,
        returnDate: data.returnDate ?? existing.returnDate,
    };

    await validateReturnData(updatedData);

    return uaeStoreStockTransferRepo.updateUAEStoreStockTransferById(
        id,
        updatedData,
    );
};

export const deleteUAEStoreStockTransferService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("UAE_RETURN_ID_INVALID");
    }

    const deleted =
        await uaeStoreStockTransferRepo.softDeleteUAEStoreStockTransferById(
            id,
        );

    if (!deleted) {
        throw new Error("UAE_RETURN_NOT_FOUND");
    }

    return deleted;
};