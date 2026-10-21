import type { Response } from "express";
import mongoose from "mongoose";
import type { RequestWithAuthData } from "../../@types/express";
import type { PackingListStatus } from "../../models/packingListModel";
import * as packingListService from "./packingListService";
import { getPaginationParams } from "../../utils/pagination";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";
import logger from "../../utils/logger";

const PACKING_LIST_STATUSES: readonly PackingListStatus[] = [
    "Pending",
    "In Transit queue",
    "Completed",
];

const isPackingListStatus = (value: unknown): value is PackingListStatus =>
    typeof value === "string" &&
    (PACKING_LIST_STATUSES as readonly string[]).includes(value);

const getPackingListId = (
    req: RequestWithAuthData,
    res: Response,
): string | null => {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        logger.warn("Invalid packing list ID");

        res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: message.PACKING_LIST_ID_INVALID,
        });

        return null;
    }

    return id;
};

const getAuthenticatedUserId = (
    req: RequestWithAuthData,
    res: Response,
    action: string,
): mongoose.Types.ObjectId | null => {
    if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
        logger.warn(`Invalid authenticated user ID while ${action} packing list`);

        res.status(statusCode.UNAUTHORIZED).json({
            success: false,
            message: message.AUTHENTICATED_USER_ID_INVALID,
        });

        return null;
    }

    return new mongoose.Types.ObjectId(req.userId);
};

const getErrorResponse = (error: unknown) => {
    if (error instanceof Error) {
        if (error.message === "PACKING_LIST_ID_INVALID") {
            return {
                status: statusCode.BAD_REQUEST,
                message: message.PACKING_LIST_ID_INVALID,
            };
        }

        if (error.message === "PACKING_ID_GENERATION_FAILED") {
            return {
                status: statusCode.CONFLICT,
                message: message.PACKING_ID_GENERATION_FAILED,
            };
        }

        if (
            error instanceof mongoose.Error.ValidationError ||
            error instanceof mongoose.Error.CastError
        ) {
            return {
                status: statusCode.BAD_REQUEST,
                message: message.PACKING_LIST_VALIDATION_FAILED,
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
            message: message.PACKING_LIST_CREATE_FAILED,
        };
    }

    return {
        status: statusCode.INTERNAL_SERVER_ERROR,
        message: message.INTERNAL_SERVER_ERROR,
    };
};

export const createPackingList = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        const userId = getAuthenticatedUserId(req, res, "creating");

        if (!userId) return res;

        const packingList = await packingListService.createPackingList(
            req.body,
            userId,
        );

        logger.info(
            `Packing list created successfully: ${packingList.packingId}`,
        );

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.PACKING_LIST_CREATED,
            data: packingList,
        });
    } catch (error) {
        logger.error("Failed to create packing list", error);

        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const getAllPackingLists = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const { status } = req.query;

        if (status !== undefined && !isPackingListStatus(status)) {
            logger.warn(`Invalid packing list status filter: ${String(status)}`);

            return res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: message.PACKING_LIST_STATUS_INVALID,
            });
        }

        const result = await packingListService.getAllPackingLists(
            page,
            limit,
            status,
        );

        logger.info("Packing lists fetched successfully");

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_LISTS_FETCHED,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        logger.error("Failed to fetch packing lists", error);

        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.PACKING_LISTS_FETCH_FAILED,
        });
    }
};

export const getPackingListById = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getPackingListId(req, res);

    if (!id) return res;

    try {
        const packingList = await packingListService.getPackingListById(id);

        if (!packingList) {
            logger.warn(`Packing list not found: ${id}`);

            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PACKING_LIST_NOT_FOUND,
            });
        }

        logger.info(
            `Packing list fetched successfully: ${packingList.packingId ?? id}`,
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_LIST_FETCHED,
            data: packingList,
        });
    } catch (error) {
        logger.error(`Failed to fetch packing list: ${id}`, error);

        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const editPackingList = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getPackingListId(req, res);

    if (!id) return res;

    try {
        const userId = getAuthenticatedUserId(req, res, "updating");

        if (!userId) return res;

        const packingList = await packingListService.editPackingList(
            id,
            req.body,
            userId,
        );

        if (!packingList) {
            logger.warn(`Packing list not found for update: ${id}`);

            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PACKING_LIST_NOT_FOUND,
            });
        }

        logger.info(
            `Packing list updated successfully: ${packingList.packingId ?? id}`,
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_LIST_UPDATED,
            data: packingList,
        });
    } catch (error) {
        logger.error(`Failed to update packing list: ${id}`, error);

        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};

export const deletePackingList = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getPackingListId(req, res);

    if (!id) return res;

    try {
        const userId = getAuthenticatedUserId(req, res, "deleting");

        if (!userId) return res;

        const packingList = await packingListService.deletePackingList(
            id,
            userId,
        );

        if (!packingList) {
            logger.warn(`Packing list not found for deletion: ${id}`);

            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PACKING_LIST_NOT_FOUND,
            });
        }

        logger.info(
            `Packing list deleted successfully: ${packingList.packingId ?? id}`,
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_LIST_DELETED,
            data: packingList,
        });
    } catch (error) {
        logger.error(`Failed to delete packing list: ${id}`, error);

        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};
export const convertPackingStylesToAED = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        const userId = getAuthenticatedUserId(
            req,
            res,
            "converting packing styles to AED",
        );

        if (!userId) return res;

        const result = await packingListService.convertPackingStylesToAED(
            req.body.styles,
            userId,
        );

        logger.info("Packing styles converted to AED successfully");

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_STYLES_AED_CONVERTED,
            data: result,
        });
    } catch (error) {
        logger.error("Failed to convert packing styles to AED", error);

        if (error instanceof Error) {
            const errorResponses: Record<
                string,
                { status: number; message: string }
            > = {
                PACKING_STYLE_TRANSIT_REQUIRED: {
                    status: statusCode.BAD_REQUEST,
                    message: message.PACKING_STYLE_TRANSIT_REQUIRED,
                },
                PACKING_STYLE_ID_INVALID: {
                    status: statusCode.BAD_REQUEST,
                    message: message.PACKING_STYLE_ID_INVALID,
                },
                DUPLICATE_PACKING_STYLE_ID: {
                    status: statusCode.BAD_REQUEST,
                    message: message.DUPLICATE_PACKING_STYLE_ID,
                },
                PACKING_STYLE_TRANSIT_INVALID: {
                    status: statusCode.BAD_REQUEST,
                    message: message.PACKING_STYLE_TRANSIT_INVALID,
                },
                PACKING_STYLE_NOT_FOUND: {
                    status: statusCode.NOT_FOUND,
                    message: message.PACKING_STYLE_NOT_FOUND,
                },
            };

            const result = errorResponses[error.message];

            if (result) {
                return res.status(result.status).json({
                    success: false,
                    message: result.message,
                });
            }
        }

        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.INTERNAL_SERVER_ERROR,
        });
    }
};
export const updatePackingListsStatus = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        const userId = getAuthenticatedUserId(
            req,
            res,
            "updating packing list statuses",
        );

        if (!userId) return res;

        const { packingListIds, packingListStatus } = req.body;

        const result = await packingListService.updatePackingListsStatus(
            packingListIds,
            packingListStatus,
            userId,
        );

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_LIST_STATUS_UPDATED,
            data: result,
        });
    } catch (error) {
        logger.error("Failed to update packing list statuses", error);

        if (error instanceof Error) {
            const errorResponses: Record<
                string,
                { status: number; message: string }
            > = {
                PACKING_LIST_IDS_REQUIRED: {
                    status: statusCode.BAD_REQUEST,
                    message: message.PACKING_LIST_IDS_REQUIRED,
                },
                PACKING_LIST_ID_INVALID: {
                    status: statusCode.BAD_REQUEST,
                    message: message.PACKING_LIST_ID_INVALID,
                },
                DUPLICATE_PACKING_LIST_IDS: {
                    status: statusCode.BAD_REQUEST,
                    message: message.DUPLICATE_PACKING_LIST_IDS,
                },
                PACKING_LIST_STATUS_INVALID: {
                    status: statusCode.BAD_REQUEST,
                    message: message.PACKING_LIST_STATUS_INVALID,
                },
                PACKING_LISTS_NOT_FOUND: {
                    status: statusCode.NOT_FOUND,
                    message: message.PACKING_LISTS_NOT_FOUND,
                },
            };

            const errorResponse = errorResponses[error.message];

            if (errorResponse) {
                return res.status(errorResponse.status).json({
                    success: false,
                    message: errorResponse.message,
                });
            }
        }

        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message.INTERNAL_SERVER_ERROR,
        });
    }
};