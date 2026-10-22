
import type { Request, Response } from "express";
import mongoose from "mongoose";
import * as receiptEntryService from "./receiptEntryService";
import type { CreateReceiptEntryInput } from "./receiptEntryService";
import { statusCode } from "../../constants/statusCode";
import { getPaginationParams } from "../../utils/pagination";
import { RequestWithAuthData } from "../../@types/express";
import { message } from "../../constants/responseMessage";

const getErrorResponse = (error: unknown) => {
    const err = error as {
        message?: string;
        code?: number;
    };

    if (err.code === 11000) {
        return {
            status: statusCode.CONFLICT,
            message: message.RECEIPT_NO_EXISTS,
        };
    }

    const errorMap: Record<
        string,
        { status: number; message: string }
    > = {
        RECEIPT_ENTRY_ID_INVALID: {
            status: statusCode.BAD_REQUEST,
            message: message.RECEIPT_ENTRY_ID_INVALID,
        },
        BILLING_INVOICE_ID_INVALID: {
            status: statusCode.BAD_REQUEST,
            message: message.BILLING_INVOICE_ID_INVALID,
        },
        BILLING_INVOICE_NOT_FOUND: {
            status: statusCode.NOT_FOUND,
            message: message.BILLING_INVOICE_NOT_FOUND,
        },
        RECEIVED_AMOUNT_INVALID: {
            status: statusCode.BAD_REQUEST,
            message: message.RECEIVED_AMOUNT_INVALID,
        },
        RECEIPT_EXCEEDS_BALANCE: {
            status: statusCode.BAD_REQUEST,
            message: message.RECEIPT_EXCEEDS_BALANCE,
        },
        RECEIPT_ENTRY_EDIT_NOT_ALLOWED: {
            status: statusCode.BAD_REQUEST,
            message: message.RECEIPT_ENTRY_EDIT_NOT_ALLOWED,
        },
    };

    return (
        errorMap[err.message ?? ""] ?? {
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: message.INTERNAL_SERVER_ERROR,
        }
    );
};

export const createReceiptEntry = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        if (!mongoose.isValidObjectId(req.userId)) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.UNAUTHORIZED,
            });
        }

        const result = await receiptEntryService.createReceiptEntry(
            req.body as CreateReceiptEntryInput,
            new mongoose.Types.ObjectId(req.userId),
        );

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.RECEIPT_ENTRY_CREATED,
            data: result,
        });
    } catch (error) {
        const response = getErrorResponse(error);

        return res.status(response.status).json({
            success: false,
            message: response.message,
        });
    }
};

export const getAllReceiptEntries = async (
    req: Request,
    res: Response,
) => {
    try {
        const { page, limit } = getPaginationParams({
            page: req.query.page,
            limit: req.query.limit,
        });

        const result = await receiptEntryService.getAllReceiptEntries(
            page,
            limit,
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.RECEIPT_ENTRIES_FETCHED,
            ...result,
        });
    } catch {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.RECEIPT_ENTRIES_FETCH_FAILED,
        });
    }
};

export const getReceiptEntryById = async (
    req: Request,
    res: Response,
) => {
    try {
        const result = await receiptEntryService.getReceiptEntryById(
            String(req.params.id),
        );

        if (!result) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.RECEIPT_ENTRY_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.RECEIPT_ENTRY_FETCHED,
            data: result,
        });
    } catch (error) {
        const response = getErrorResponse(error);

        return res.status(response.status).json({
            success: false,
            message: response.message,
        });
    }
};

export const getReceiptEntriesByInvoice = async (
    req: Request,
    res: Response,
) => {
    try {
        const result =
            await receiptEntryService.getReceiptEntriesByInvoice(
                String(req.params.invoiceId),
            );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.RECEIPT_ENTRIES_FETCHED,
            data: result,
        });
    } catch (error) {
        const response = getErrorResponse(error);

        return res.status(response.status).json({
            success: false,
            message: response.message,
        });
    }
};

export const editReceiptEntry = async (
    req: Request,
    res: Response,
) => {
    try {
        const result = await receiptEntryService.editReceiptEntry(
            String(req.params.id),
            req.body,
        );

        if (!result) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.RECEIPT_ENTRY_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.RECEIPT_ENTRY_UPDATED,
            data: result,
        });
    } catch (error) {
        const response = getErrorResponse(error);

        return res.status(response.status).json({
            success: false,
            message: response.message,
        });
    }
};

export const deleteReceiptEntry = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        if (!mongoose.isValidObjectId(req.userId)) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.UNAUTHORIZED,
            });
        }

        const result = await receiptEntryService.deleteReceiptEntry(
            String(req.params.id),
            new mongoose.Types.ObjectId(req.userId),
        );

        if (!result) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.RECEIPT_ENTRY_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.RECEIPT_ENTRY_DELETED,
            data: result,
        });
    } catch (error) {
        const response = getErrorResponse(error);

        return res.status(response.status).json({
            success: false,
            message: response.message,
        });
    }
};
