
import type { Request, Response } from "express";
import * as billingService from "./billingService";
import logger from "../../utils/logger";

const getErrorStatus = (error: unknown): number => {
    const errorMessage =
        error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    if (errorMessage === "BILLING_NOT_FOUND") return 404;

    if (
        errorMessage === "BILLING_ID_INVALID" ||
        errorMessage === "CUSTOMER_ID_INVALID" ||
        errorMessage === "UAE_STORE_STOCK_TRANSFER_ID_INVALID" ||
        errorMessage === "PACKING_STYLE_ID_INVALID" ||
        errorMessage === "BILLING_QTY_INVALID" ||
        errorMessage === "BILLING_STYLE_NO_REQUIRED" ||
        errorMessage === "BILLING_PRODUCT_NAME_REQUIRED" ||
        errorMessage === "UNIT_PRICE_INVALID" ||
        errorMessage === "RETURN_AMOUNT_INVALID" ||
        errorMessage === "RECEIVED_AMOUNT_INVALID" ||
        errorMessage === "RETURN_AMOUNT_EXCEEDS_INVOICE_TOTAL" ||
        errorMessage === "RECEIVED_AMOUNT_EXCEEDS_NET_AMOUNT" ||
        errorMessage === "BILLING_DATE_INVALID" ||
        errorMessage === "BILLING_PRODUCTS_REQUIRED" ||
        errorMessage === "PAGINATION_INVALID"
    ) {
        return 400;
    }

    return 500;
};

const handleError = (
    res: Response,
    error: unknown,
    operation: string,
) => {
    const errorMessage =
        error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    logger.error(`${operation}: ${errorMessage}`);

    return res.status(getErrorStatus(error)).json({
        success: false,
        message: errorMessage,
    });
};

export const createBillingController = async (
    req: Request,
    res: Response,
) => {
    try {
        const billing = await billingService.createBillingService(req.body);

        return res.status(201).json({
            success: true,
            message: "BILLING_CREATED",
            data: billing,
        });
    } catch (error) {
        return handleError(res, error, "CREATE_BILLING_ERROR");
    }
};

export const getAllBillingsController = async (
    req: Request,
    res: Response,
) => {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const search =
            typeof req.query.search === "string"
                ? req.query.search
                : undefined;
        const customer =
            typeof req.query.customer === "string"
                ? req.query.customer
                : undefined;

        const result = await billingService.getAllBillingsService(
            page,
            limit,
            search,
            customer,
        );

        const totalPages = Math.ceil(result.totalRecords / Math.min(limit, 100));

        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: {
                currentPage: page,
                limit: Math.min(limit, 100),
                totalRecords: result.totalRecords,
                totalPages,
                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,
            },
        });
    } catch (error) {
        return handleError(res, error, "GET_ALL_BILLINGS_ERROR");
    }
};

export const getBillingByIdController = async (
    req: Request,
    res: Response,
) => {
    try {
        const billing = await billingService.getBillingByIdService(
            String(req.params.id),
        );

        return res.status(200).json({
            success: true,
            message: "BILLING_FETCHED",
            data: billing,
        });
    } catch (error) {
        return handleError(res, error, "GET_BILLING_BY_ID_ERROR");
    }
};

export const updateBillingController = async (
    req: Request,
    res: Response,
) => {
    try {
        const billing = await billingService.updateBillingService(
            String(req.params.id),
            req.body,
        );

        return res.status(200).json({
            success: true,
            message: "BILLING_UPDATED",
            data: billing,
        });
    } catch (error) {
        return handleError(res, error, "UPDATE_BILLING_ERROR");
    }
};

export const deleteBillingController = async (
    req: Request,
    res: Response,
) => {
    try {
        const billing = await billingService.deleteBillingService(
            String(req.params.id),
        );

        return res.status(200).json({
            success: true,
            message: "BILLING_DELETED",
            data: billing,
        });
    } catch (error) {
        return handleError(res, error, "DELETE_BILLING_ERROR");
    }
};
