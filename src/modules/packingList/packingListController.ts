import type { Response } from "express";
import mongoose from "mongoose";
import type { RequestWithAuthData } from "../../@types/express";
import * as packingListService from "./packingListService";
import { getPaginationParams } from "../../utils/pagination";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";
import logger from "../../utils/logger";

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

const getErrorResponse = (error: unknown) => {
    if (error instanceof Error) {
        if (error.message === "PACKING_LIST_ID_INVALID") {
            return {
                status: statusCode.BAD_REQUEST,
                message: message.PACKING_LIST_ID_INVALID,
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
        if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
            logger.warn("Invalid authenticated user ID while creating packing list");

            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const packingList = await packingListService.createPackingList(
            req.body,
            new mongoose.Types.ObjectId(req.userId),
        );

        logger.info("Packing list created successfully");

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
        const result = await packingListService.getAllPackingLists(page, limit);

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

        logger.info(`Packing list fetched successfully: ${id}`);

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
        if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
            logger.warn("Invalid authenticated user ID while updating packing list");

            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const packingList = await packingListService.editPackingList(
            id,
            req.body,
            new mongoose.Types.ObjectId(req.userId),
        );

        if (!packingList) {
            logger.warn(`Packing list not found for update: ${id}`);

            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PACKING_LIST_NOT_FOUND,
            });
        }

        logger.info(`Packing list updated successfully: ${id}`);

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
        if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
            logger.warn("Invalid authenticated user ID while deleting packing list");

            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const packingList = await packingListService.deletePackingList(
            id,
            new mongoose.Types.ObjectId(req.userId),
        );

        if (!packingList) {
            logger.warn(`Packing list not found for deletion: ${id}`);

            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PACKING_LIST_NOT_FOUND,
            });
        }

        logger.info(`Packing list deleted successfully: ${id}`);

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