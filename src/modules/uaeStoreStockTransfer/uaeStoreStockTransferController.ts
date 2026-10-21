import type { Request, Response } from "express";
import * as uaeStoreStockTransferService from "./uaeStoreStockTransferService";
import { message } from "../../constants/responseMessage";
import { statusCode } from "../../constants/statusCode";
import logger from "../../utils/logger";

const errorResponses: Record<
    string,
    { status: number; message: string }
> = {
    PACKING_LIST_ID_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.PACKING_LIST_ID_INVALID,
    },
    PACKING_LIST_NOT_FOUND: {
        status: statusCode.NOT_FOUND,
        message: message.PACKING_LIST_NOT_FOUND,
    },
    FROM_STORE_ID_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.FROM_STORE_ID_INVALID,
    },
    TO_STORE_ID_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.TO_STORE_ID_INVALID,
    },
    FROM_STORE_TO_STORE_SAME: {
        status: statusCode.BAD_REQUEST,
        message: message.FROM_STORE_TO_STORE_SAME,
    },
    FROM_STORE_NOT_FOUND: {
        status: statusCode.NOT_FOUND,
        message: message.FROM_STORE_NOT_FOUND,
    },
    TO_STORE_NOT_FOUND: {
        status: statusCode.NOT_FOUND,
        message: message.TO_STORE_NOT_FOUND,
    },
    RETURN_TYPE_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.RETURN_TYPE_INVALID,
    },
    RETURN_REASON_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.RETURN_REASON_INVALID,
    },
    INVOICE_VALUE_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.INVOICE_VALUE_INVALID,
    },
    UPDATED_INVOICE_VALUE_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.UPDATED_INVOICE_VALUE_INVALID,
    },
    IN_STORE_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.IN_STORE_INVALID,
    },
    RETURN_DATE_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.RETURN_DATE_INVALID,
    },
    RETURN_PRODUCTS_REQUIRED: {
        status: statusCode.BAD_REQUEST,
        message: message.RETURN_PRODUCTS_REQUIRED,
    },
    RETURN_PRODUCT_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.RETURN_PRODUCT_INVALID,
    },
    RETURN_PRODUCT_PACKING_LIST_MISMATCH: {
        status: statusCode.BAD_REQUEST,
        message: message.RETURN_PRODUCT_PACKING_LIST_MISMATCH,
    },
    PACKING_STYLE_NOT_FOUND: {
        status: statusCode.NOT_FOUND,
        message: message.PACKING_STYLE_NOT_FOUND,
    },
    RETURNED_QTY_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.RETURNED_QTY_INVALID,
    },
    UAE_RETURN_ID_INVALID: {
        status: statusCode.BAD_REQUEST,
        message: message.UAE_RETURN_ID_INVALID,
    },
    UAE_RETURN_NOT_FOUND: {
        status: statusCode.NOT_FOUND,
        message: message.UAE_RETURN_NOT_FOUND,
    },
    TO_STORE_REQUIRED: {
        status: statusCode.BAD_REQUEST,
        message: message.TO_STORE_ID_INVALID,
    },
};

const handleError = (error: unknown, res: Response) => {
    const errorCode =
        error instanceof Error
            ? error.message
            : "INTERNAL_SERVER_ERROR";

    if (
        errorCode === "Page and limit must be positive integers"
    ) {
        return res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: message.PAGINATION_INVALID,
        });
    }

    const knownError = errorResponses[errorCode];

    if (knownError) {
        return res.status(knownError.status).json({
            success: false,
            message: knownError.message,
        });
    }

    logger.error("UAE Store Stock Transfer error", { error });

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: message.INTERNAL_SERVER_ERROR,
    });
};

export const createUAEStoreStockTransferController = async (
    req: Request,
    res: Response,
) => {
    try {
        const data =
            await uaeStoreStockTransferService.createUAEStoreStockTransferService(
                req.body,
            );

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.UAE_RETURN_CREATED,
            data,
        });
    } catch (error) {
        return handleError(error, res);
    }
};

export const getAllUAEStoreStockTransfersController = async (
    req: Request,
    res: Response,
) => {
    try {
        const result =
            await uaeStoreStockTransferService.getAllUAEStoreStockTransfersService(
                req.query,
                typeof req.query.packingList === "string"
                    ? req.query.packingList
                    : undefined,
                typeof req.query.fromStore === "string"
                    ? req.query.fromStore
                    : undefined,
                typeof req.query.toStore === "string"
                    ? req.query.toStore
                    : undefined,
            );

        return res.status(statusCode.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
};

export const getAvailablePackingListsForFromStoreController = async (
    req: Request,
    res: Response,
) => {
    try {
        const result =
            await uaeStoreStockTransferService.getAvailablePackingListsForFromStoreService(
                req.query,
            );

        return res.status(statusCode.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
};

export const getReturnedPackingListsForToStoreController = async (
    req: Request,
    res: Response,
) => {
    try {
        const toStore =
            typeof req.query.toStore === "string"
                ? req.query.toStore
                : "";

        if (!toStore) {
            return res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: message.TO_STORE_ID_INVALID,
            });
        }

        const result =
            await uaeStoreStockTransferService.getReturnedPackingListsForToStoreService(
                toStore,
                req.query,
            );

        return res.status(statusCode.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
};

export const getUAEStoreStockTransferByIdController = async (
    req: Request,
    res: Response,
) => {
    try {
        const data =
            await uaeStoreStockTransferService.getUAEStoreStockTransferByIdService(
                String(req.params.id),
            );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.UAE_RETURN_FETCHED,
            data,
        });
    } catch (error) {
        return handleError(error, res);
    }
};

export const updateUAEStoreStockTransferController = async (
    req: Request,
    res: Response,
) => {
    try {
        const data =
            await uaeStoreStockTransferService.updateUAEStoreStockTransferService(
                String(req.params.id),
                req.body,
            );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.UAE_RETURN_UPDATED,
            data,
        });
    } catch (error) {
        return handleError(error, res);
    }
};

export const deleteUAEStoreStockTransferController = async (
    req: Request,
    res: Response,
) => {
    try {
        await uaeStoreStockTransferService.deleteUAEStoreStockTransferService(
            String(req.params.id),
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.UAE_RETURN_DELETED,
        });
    } catch (error) {
        return handleError(error, res);
    }
};