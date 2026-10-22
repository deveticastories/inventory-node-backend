import type { Request, Response } from "express";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";
import { getPaginationParams } from "../../utils/pagination";
import { getAllPurchaseEntryReportsService,getAllSalesReportsService,getAllDebitReportsService } from "./reportsService";

export const getAllPurchaseEntryReportsController = async (
    req: Request,
    res: Response,
) => {
    try {
        const { page, limit } = getPaginationParams({
            page: req.query.page,
            limit: req.query.limit,
        });

        const report = await getAllPurchaseEntryReportsService(page, limit);

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PURCHASE_ENTRY_FETCH_SUCCESS,
            data: report.data,
            pagination: report.pagination,
        });
    } catch {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.INTERNAL_SERVER_ERROR,
        });
    }
};
export const getAllSalesReportsController = async (
    req: Request,
    res: Response,
) => {
    try {
        const { page, limit } = getPaginationParams({
            page: req.query.page,
            limit: req.query.limit,
        });

        const billId =
            typeof req.query.billId === "string"
                ? req.query.billId
                : undefined;

        const report = await getAllSalesReportsService(
            page,
            limit,
            billId,
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.SALES_REPORT_FETCH_SUCCESS,
            data: report.data,
            pagination: report.pagination,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "INVALID_BILL_ID"
        ) {
            return res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: message.INVALID_ID,
            });
        }

        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.INTERNAL_SERVER_ERROR,
        });
    }
};
export const getAllDebitReportsController = async (
    req: Request,
    res: Response,
) => {
    try {
        const { page, limit } = getPaginationParams({
            page: req.query.page,
            limit: req.query.limit,
        });

        const report = await getAllDebitReportsService(page, limit);

        return res.status(statusCode.OK).json({
            success: true,
            message: message.DEBIT_REPORT_FETCH_SUCCESS,
            data: report.data,
            pagination: report.pagination,
        });
    } catch {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.INTERNAL_SERVER_ERROR,
        });
    }
};