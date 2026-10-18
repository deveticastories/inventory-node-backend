
import type { Response } from "express";
import mongoose from "mongoose";
import type { RequestWithAuthData } from "../../@types/express";
import * as dailyExpenseService from "./dailyExpenseService";
import { getPaginationParams } from "../../utils/pagination";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";

const getDailyExpenseId = (
    req: RequestWithAuthData,
    res: Response,
): string | null => {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: message.DAILY_EXPENSE_ID_INVALID,
        });

        return null;
    }

    return id;
};

const getErrorResponse = (error: unknown) => {
    if (error instanceof Error) {
        if (error.message === "DAILY_EXPENSE_ID_INVALID") {
            return {
                status: statusCode.BAD_REQUEST,
                message: message.DAILY_EXPENSE_ID_INVALID,
            };
        }

        if (error.message === "DAILY_EXPENSE_ALREADY_ASSIGNED") {
            return {
                status: statusCode.CONFLICT,
                message: message.DAILY_EXPENSE_ALREADY_ASSIGNED,
            };
        }
    }

    return {
        status: statusCode.INTERNAL_SERVER_ERROR,
        message: message.INTERNAL_SERVER_ERROR,
    };
};

export const createDailyExpense = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const expense = await dailyExpenseService.createDailyExpense(
            req.body,
            new mongoose.Types.ObjectId(req.userId),
        );

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.DAILY_EXPENSE_CREATED,
            data: expense,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const getAllDailyExpenses = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const result = await dailyExpenseService.getAllDailyExpenses(
            page,
            limit,
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.DAILY_EXPENSES_FETCHED,
            data: result.data,
            totalAmount: result.totalAmount,
            pagination: result.pagination,
        });
    } catch {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.DAILY_EXPENSES_FETCH_FAILED,
        });
    }
};

export const getDailyExpenseById = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getDailyExpenseId(req, res);

    if (!id) return res;

    try {
        const expense = await dailyExpenseService.getDailyExpenseById(id);

        if (!expense) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.DAILY_EXPENSE_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.DAILY_EXPENSE_FETCHED,
            data: expense,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const updateDailyExpensePacking = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getDailyExpenseId(req, res);

    if (!id) return res;

    try {
        if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const expense = await dailyExpenseService.updateDailyExpensePacking(
            id,
            req.body,
            new mongoose.Types.ObjectId(req.userId),
        );

        if (!expense) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.DAILY_EXPENSE_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.DAILY_EXPENSE_PACKING_UPDATED,
            data: expense,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const deleteDailyExpense = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getDailyExpenseId(req, res);

    if (!id) return res;

    try {
        if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const expense = await dailyExpenseService.deleteDailyExpense(
            id,
            new mongoose.Types.ObjectId(req.userId),
        );

        if (!expense) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.DAILY_EXPENSE_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.DAILY_EXPENSE_DELETED,
            data: expense,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};
