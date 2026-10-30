import type { Response } from "express";
import type { RequestWithAuthData } from "../../@types/express";
import * as uaeStoreStockTransferService from "./uaeStoreStockTransferService";
import { statusCode } from "../../constants/statusCode";
import { sendError } from "../../utils/errorStatus";

const queryString = (value: unknown) =>
    typeof value === "string" && value.trim() ? value : undefined;

export const getUAEMainStockController = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        const result = await uaeStoreStockTransferService.getUAEMainStockService(
            queryString(req.query.search),
            queryString(req.query.sortBy),
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: "UAE_MAIN_STOCK_FETCHED",
            ...result,
        });
    } catch (error) {
        return sendError(res, error, "GET_UAE_MAIN_STOCK_ERROR");
    }
};

export const getReturnStoreStockController = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        const result =
            await uaeStoreStockTransferService.getReturnStoreStockService(
                queryString(req.query.search),
                queryString(req.query.sortBy),
            );

        return res.status(statusCode.OK).json({
            success: true,
            message: "UAE_RETURN_STOCK_FETCHED",
            ...result,
        });
    } catch (error) {
        return sendError(res, error, "GET_UAE_RETURN_STOCK_ERROR");
    }
};

export const getReturnableProductsController = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        const data =
            await uaeStoreStockTransferService.getReturnableProductsService(
                String(req.params.invoiceId),
            );

        return res.status(statusCode.OK).json({
            success: true,
            message: "UAE_RETURNABLE_PRODUCTS_FETCHED",
            data,
        });
    } catch (error) {
        return sendError(res, error, "GET_RETURNABLE_PRODUCTS_ERROR");
    }
};

export const moveReturnToMainStoreController = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        const data =
            await uaeStoreStockTransferService.moveReturnToMainStoreService(
                req.body ?? {},
                req.userId,
            );

        return res.status(statusCode.OK).json({
            success: true,
            message: "UAE_RETURN_MOVED_TO_MAIN",
            data,
        });
    } catch (error) {
        return sendError(res, error, "MOVE_RETURN_TO_MAIN_ERROR");
    }
};

export const createUAEStoreStockTransferController = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        const data =
            await uaeStoreStockTransferService.createUAEStoreStockTransferService(
                req.body ?? {},
                req.userId,
            );

        return res.status(statusCode.CREATED).json({
            success: true,
            message: "UAE_RETURN_CREATED",
            data,
        });
    } catch (error) {
        return sendError(res, error, "CREATE_UAE_RETURN_ERROR");
    }
};

export const getAllUAEStoreStockTransfersController = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        const result =
            await uaeStoreStockTransferService.getAllUAEStoreStockTransfersService(
                req.query,
                queryString(req.query.invoice),
            );

        return res.status(statusCode.OK).json({
            ...result,
            message: "UAE_RETURNS_FETCHED",
        });
    } catch (error) {
        return sendError(res, error, "GET_UAE_RETURNS_ERROR");
    }
};

export const getUAEStoreStockTransferByIdController = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        const data =
            await uaeStoreStockTransferService.getUAEStoreStockTransferByIdService(
                String(req.params.id),
            );

        return res.status(statusCode.OK).json({
            success: true,
            message: "UAE_RETURN_FETCHED",
            data,
        });
    } catch (error) {
        return sendError(res, error, "GET_UAE_RETURN_ERROR");
    }
};

export const deleteUAEStoreStockTransferController = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        const data =
            await uaeStoreStockTransferService.deleteUAEStoreStockTransferService(
                String(req.params.id),
                req.userId,
            );

        return res.status(statusCode.OK).json({
            success: true,
            message: "UAE_RETURN_DELETED",
            data,
        });
    } catch (error) {
        return sendError(res, error, "DELETE_UAE_RETURN_ERROR");
    }
};
