
import type { Request, Response } from "express";
import {
    getIndianStoreStockTransferProducts,
    createIndianStoreStockTransferService,
    getIndianStoreStockTransferById,
    getAllIndianStoreStockTransfers,
} from "./indianStoreStockTransferService";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";
import type { RequestWithAuthData } from "../../@types/express";
import {
    getPaginationMeta,
    getPaginationParams,
} from "../../utils/pagination";

export const getIndianStoreStockTransferProductsController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const storeId =
            typeof req.query.storeId === "string"
                ? req.query.storeId
                : "";

        const storeType =
            typeof req.query.storeType === "string"
                ? req.query.storeType
                : "";

        if (!storeId) {
            res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: "STORE_ID_REQUIRED",
            });
            return;
        }

        if (storeType !== "fromStore" && storeType !== "toStore") {
            res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: "STORE_TYPE_INVALID",
            });
            return;
        }

        const products = await getIndianStoreStockTransferProducts(
            storeId,
            storeType,
        );

        res.status(statusCode.OK).json({
            success: true,
            message: message.INDIAN_STORE_STOCK_TRANSFER_PRODUCTS_FETCHED,
            data: products,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : message.INTERNAL_SERVER_ERROR;

        const status =
            errorMessage === "STORE_ID_INVALID"
                ? statusCode.BAD_REQUEST
                : errorMessage === "STORE_NOT_FOUND"
                  ? statusCode.NOT_FOUND
                  : statusCode.INTERNAL_SERVER_ERROR;

        res.status(status).json({
            success: false,
            message: errorMessage,
        });
    }
};

export const createIndianStoreStockTransferController = async (
    req: RequestWithAuthData,
    res: Response
): Promise<void> => {
    try {
        const transfer = await createIndianStoreStockTransferService(
            req.body
        );

        res.status(statusCode.CREATED).json({
            success: true,
            message: message.INDIAN_STORE_STOCK_TRANSFER_CREATED,
            data: transfer,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : message.INTERNAL_SERVER_ERROR;

        const badRequestErrors = [
            "STORE_ID_INVALID",
            "STORES_MUST_BE_DIFFERENT",
            "TRANSFER_PRODUCTS_REQUIRED",
            "MAIN_STORE_ID_NOT_CONFIGURED",
            "QUALITY_CHECK_PRODUCT_ID_INVALID",
            "TRANSFER_QUANTITY_INVALID",
            "DUPLICATE_TRANSFER_PRODUCT",
            "INSUFFICIENT_STORE_STOCK",
        ];

        const notFoundErrors = [
            "STORE_NOT_FOUND",
            "QUALITY_CHECK_PRODUCT_NOT_FOUND",
        ];

        const status = badRequestErrors.includes(errorMessage)
            ? statusCode.BAD_REQUEST
            : notFoundErrors.includes(errorMessage)
              ? statusCode.NOT_FOUND
              : statusCode.INTERNAL_SERVER_ERROR;

        res.status(status).json({
            success: false,
            message: errorMessage,
        });
    }
};

export const getIndianStoreStockTransferByIdController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const id = req.params.id;

        if (typeof id !== "string" || !id) {
            res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: message.INDIAN_STORE_STOCK_TRANSFER_ID_INVALID,
            });
            return;
        }

        const transfer = await getIndianStoreStockTransferById(id);

        res.status(statusCode.OK).json({
            success: true,
            message: message.INDIAN_STORE_STOCK_TRANSFER_FETCHED,
            data: transfer,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : message.INTERNAL_SERVER_ERROR;

        const status =
            errorMessage === "INDIAN_STORE_STOCK_TRANSFER_ID_INVALID"
                ? statusCode.BAD_REQUEST
                : errorMessage === "INDIAN_STORE_STOCK_TRANSFER_NOT_FOUND"
                  ? statusCode.NOT_FOUND
                  : statusCode.INTERNAL_SERVER_ERROR;

        res.status(status).json({
            success: false,
            message: errorMessage,
        });
    }
};

export const getAllIndianStoreStockTransfersController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { page, limit } = getPaginationParams(req.query);

        const search =
            typeof req.query.search === "string"
                ? req.query.search
                : undefined;

        const fromStore =
            typeof req.query.fromStore === "string"
                ? req.query.fromStore
                : undefined;

        const toStore =
            typeof req.query.toStore === "string"
                ? req.query.toStore
                : undefined;

        if (fromStore && toStore) {
            res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: "USE_ONLY_ONE_STORE_FILTER",
            });
            return;
        }

        const result = await getAllIndianStoreStockTransfers(
            page,
            limit,
            search,
            fromStore,
            toStore
        );

        res.status(statusCode.OK).json({
            success: true,
            message: message.INDIAN_STORE_STOCK_TRANSFERS_FETCHED,
            data: result.data,
            pagination: getPaginationMeta(
                page,
                limit,
                result.totalRecords
            ),
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : message.INTERNAL_SERVER_ERROR;

        const status =
            errorMessage === "STORE_ID_INVALID"
                ? statusCode.BAD_REQUEST
                : errorMessage === "STORE_NOT_FOUND"
                  ? statusCode.NOT_FOUND
                  : statusCode.INTERNAL_SERVER_ERROR;

        res.status(status).json({
            success: false,
            message: errorMessage,
        });
    }
};
