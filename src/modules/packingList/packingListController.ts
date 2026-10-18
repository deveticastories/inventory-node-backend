import type { Response } from "express";
import mongoose from "mongoose";
import type { RequestWithAuthData } from "../../@types/express";
import * as packingListService from "./packingListService";
import { getPaginationParams } from "../../utils/pagination";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";

const getPackingListId = (
    req: RequestWithAuthData,
    res: Response,
): string | null => {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
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
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const packingList = await packingListService.createPackingList(
            req.body,
            new mongoose.Types.ObjectId(req.userId),
        );

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.PACKING_LIST_CREATED,
            data: packingList,
        });
    } catch (error) {
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

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_LISTS_FETCHED,
            data: result.data,
            pagination: result.pagination,
        });
    } catch {
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
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PACKING_LIST_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_LIST_FETCHED,
            data: packingList,
        });
    } catch (error) {
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
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PACKING_LIST_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_LIST_UPDATED,
            data: packingList,
        });
    } catch (error) {
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
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.PACKING_LIST_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.PACKING_LIST_DELETED,
            data: packingList,
        });
    } catch (error) {
        const result = getErrorResponse(error);

        return res.status(result.status).json({
            success: false,
            message: result.message,
        });
    }
};