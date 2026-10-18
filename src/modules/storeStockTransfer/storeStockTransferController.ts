import type { Request, Response } from "express";
import {
    createStockTransferService,
    getAllStockTransfersService,
    getStoreStockService,
} from "./storeStockTransferService";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";

export const createStockTransferController = async (
    req: Request,
    res: Response,
) => {
    try {
        const transfer = await createStockTransferService(req.body);

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.STOCK_TRANSFER_CREATED,
            data: transfer,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            const status = [
                message.INVALID_TRANSFER_PRODUCTS,
                message.INSUFFICIENT_STOCK,
            ].includes(error.message)
                ? statusCode.BAD_REQUEST
                : [
                    message.PURCHASE_ENTRY_NOT_FOUND,
                    message.QUALITY_CHECK_NOT_FOUND,
                ].includes(error.message)
                    ? statusCode.NOT_FOUND
                    : statusCode.INTERNAL_SERVER_ERROR;

            return res.status(status).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.INTERNAL_SERVER_ERROR,
        });
    }
};

export const getAllStockTransfersController = async (
    _req: Request,
    res: Response,
) => {
    try {
        const transfers = await getAllStockTransfersService();

        return res.status(statusCode.OK).json({
            success: true,
            message: message.STOCK_TRANSFERS_FETCHED,
            data: transfers,
        });
    } catch (error: unknown) {
        console.error("Get all stock transfers error:", error);

        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.INTERNAL_SERVER_ERROR,
        });
    }
};

export const getStoreStockController = async (
    req: Request,
    res: Response,
) => {
    try {
        const storeName = req.params.storeName;

        if (
            typeof storeName !== "string" ||
            !storeName.trim()
        ) {
            return res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: message.INVALID_TRANSFER_PRODUCTS,
            });
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 10);

        const stock = await getStoreStockService(
            storeName.trim(),
            page,
            limit,
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.STORE_STOCK_FETCHED,
            data: stock,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            const status =
                error.message === message.INVALID_TRANSFER_PRODUCTS
                    ? statusCode.BAD_REQUEST
                    : statusCode.INTERNAL_SERVER_ERROR;

            return res.status(status).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.INTERNAL_SERVER_ERROR,
        });
    }
};
