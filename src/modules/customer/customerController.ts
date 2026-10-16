import type { Response } from "express";
import mongoose from "mongoose";
import type { RequestWithAuthData } from "../../@types/express";
import * as customerService from "./customerService";
import { getPaginationParams } from "../../utils/pagination";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";

const getCustomerId = (
    req: RequestWithAuthData,
    res: Response,
): string | null => {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: message.CUSTOMER_ID_INVALID,
        });

        return null;
    }

    return id;
};

const getErrorResponse = (error: unknown) => {
    if (error instanceof Error) {
        if (error.message === "CUSTOMER_EMAIL_EXISTS") {
            return {
                status: statusCode.CONFLICT,
                message: message.CUSTOMER_EMAIL_EXISTS,
            };
        }

        if (error.message === "CUSTOMER_WHATSAPP_EXISTS") {
            return {
                status: statusCode.CONFLICT,
                message: message.CUSTOMER_WHATSAPP_EXISTS,
            };
        }

        if (error.message === "CUSTOMER_ID_INVALID") {
            return {
                status: statusCode.BAD_REQUEST,
                message: message.CUSTOMER_ID_INVALID,
            };
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
            message: message.CUSTOMER_WHATSAPP_EXISTS,
        };
    }

    return {
        status: statusCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
    };
};

export const createCustomer = async (
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

        const customer = await customerService.createCustomer(
            req.body,
            new mongoose.Types.ObjectId(req.userId),
        );

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.CUSTOMER_CREATED,
            data: customer,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const getAllCustomers = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const result = await customerService.getAllCustomers(page, limit);

        return res.status(statusCode.OK).json({
            success: true,
            message: message.CUSTOMERS_FETCHED,
            data: result.data,
            pagination: result.pagination,
        });
    } catch {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch customers",
        });
    }
};

export const getCustomerById = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getCustomerId(req, res);

    if (!id) return res;

    try {
        const customer = await customerService.getCustomerById(id);

        if (!customer) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.CUSTOMER_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.CUSTOMER_FETCHED,
            data: customer,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const editCustomer = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getCustomerId(req, res);

    if (!id) return res;

    try {
        if (!req.userId) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const customer = await customerService.editCustomer(
            id,
            req.body,
            new mongoose.Types.ObjectId(req.userId),
        );

        if (!customer) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.CUSTOMER_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.CUSTOMER_UPDATED,
            data: customer,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const deleteCustomer = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getCustomerId(req, res);

    if (!id) return res;

    try {
        if (!req.userId) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const customer = await customerService.deleteCustomer(
            id,
            new mongoose.Types.ObjectId(req.userId),
        );

        if (!customer) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.CUSTOMER_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.CUSTOMER_DELETED,
            data: customer,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};