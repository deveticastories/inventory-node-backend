
import type { Response } from "express";
import mongoose from "mongoose";
import type { RequestWithAuthData } from "../../@types/express";
import * as paymentEntryService from "./paymentEntryService";
import { getPaginationParams } from "../../utils/pagination";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";

const getPaymentEntryId = (
    req: RequestWithAuthData,
    res: Response,
): string | null => {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: message.PAYMENT_ENTRY_ID_INVALID,
        });

        return null;
    }

    return id;
};

const getErrorResponse = (error: unknown) => {
    if (error instanceof Error) {
        const errorMap: Record<
            string,
            { status: number; message: string }
        > = {
            PAYMENT_ENTRY_ID_INVALID: {
                status: statusCode.BAD_REQUEST,
                message: message.PAYMENT_ENTRY_ID_INVALID,
            },
            PURCHASE_ENTRY_ID_INVALID: {
                status: statusCode.BAD_REQUEST,
                message: message.PURCHASE_ENTRY_ID_INVALID,
            },
            PURCHASE_ENTRY_NOT_FOUND: {
                status: statusCode.NOT_FOUND,
                message: message.PURCHASE_ENTRY_NOT_FOUND,
            },
            PAYMENT_AMOUNT_INVALID: {
                status: statusCode.BAD_REQUEST,
                message: message.PAYMENT_AMOUNT_INVALID,
            },
            PAYMENT_EXCEEDS_BALANCE: {
                status: statusCode.BAD_REQUEST,
                message: message.PAYMENT_EXCEEDS_BALANCE,
            },
            PAYMENT_ENTRY_EDIT_NOT_ALLOWED: {
                status: statusCode.BAD_REQUEST,
                message: message.PAYMENT_ENTRY_EDIT_NOT_ALLOWED,
            },
        };

        if (errorMap[error.message]) {
            return errorMap[error.message];
        }
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
    ) {
        return {
            status: statusCode.CONFLICT,
            message: message.PAYMENT_VOUCHER_NO_EXISTS,
        };
    }

    return {
        status: statusCode.INTERNAL_SERVER_ERROR,
        message: message.INTERNAL_SERVER_ERROR,
    };
};

export const createPaymentEntry = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        if (!req.userId) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const paymentEntry = await paymentEntryService.createPaymentEntry(
            req.body,
            new mongoose.Types.ObjectId(req.userId),
        );

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.PAYMENT_ENTRY_CREATED,
            data: paymentEntry,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const getAllPaymentEntries = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const result = await paymentEntryService.getAllPaymentEntries(
            page,
            limit,
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PAYMENT_ENTRIES_FETCHED,
            data: result.data,
            pagination: result.pagination,
        });
    } catch {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.PAYMENT_ENTRIES_FETCH_FAILED,
        });
    }
};

export const getPaymentEntryById = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getPaymentEntryId(req, res);

    if (!id) return res;

    try {
        const paymentEntry =
            await paymentEntryService.getPaymentEntryById(id);

        if (!paymentEntry) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PAYMENT_ENTRY_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PAYMENT_ENTRY_FETCHED,
            data: paymentEntry,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const getPaymentEntriesByPurchaseEntry = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const purchaseInvoice = req.params.purchaseInvoice;

    if (
        typeof purchaseInvoice !== "string" ||
        !mongoose.isValidObjectId(purchaseInvoice)
    ) {
        return res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: message.PURCHASE_ENTRY_ID_INVALID,
        });
    }

    try {
        const paymentEntries =
            await paymentEntryService.getPaymentEntriesByPurchaseEntry(
                purchaseInvoice,
            );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PAYMENT_ENTRIES_FETCHED,
            data: paymentEntries,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const editPaymentEntry = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getPaymentEntryId(req, res);

    if (!id) return res;

    try {
        const paymentEntry = await paymentEntryService.editPaymentEntry(
            id,
            req.body,
        );

        if (!paymentEntry) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PAYMENT_ENTRY_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PAYMENT_ENTRY_UPDATED,
            data: paymentEntry,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const deletePaymentEntry = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getPaymentEntryId(req, res);

    if (!id) return res;

    try {
        if (!req.userId) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const paymentEntry = await paymentEntryService.deletePaymentEntry(
            id,
            new mongoose.Types.ObjectId(req.userId),
        );

        if (!paymentEntry) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PAYMENT_ENTRY_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PAYMENT_ENTRY_DELETED,
            data: paymentEntry,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};
