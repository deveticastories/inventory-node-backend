import type { Response } from "express";
import mongoose from "mongoose";
import type { RequestWithAuthData } from "../../@types/express";
import * as vendorService from "./vendorService";
import { getPaginationParams } from "../../utils/pagination";
import { paginatedResponse } from "../../utils/response";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";

const getVendorId = (req: RequestWithAuthData, res: Response): string | null => {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
        res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: message.VENDOR_ID_INVALID,
        });
        return null;
    }

    return id;
};

export const createVendor = async (
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

        const vendor = await vendorService.createVendor({
            ...req.body,
            createdBy: new mongoose.Types.ObjectId(req.userId),
        });

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.VENDOR_CREATED,
            data: vendor,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === message.CONTACT_NO_EXISTS
        ) {
            return res.status(statusCode.CONFLICT).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to create vendor",
        });
    }
};

export const getAllVendors = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const result = await vendorService.getAllVendors(page, limit);

        return res.status(statusCode.OK).json(
            paginatedResponse(result.data, result.pagination),
        );
    } catch (error) {
        return res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch vendors",
        });
    }
};
export const getVendorById = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getVendorId(req, res);
    if (!id) return res;

    try {
        const vendor = await vendorService.getVendorById(id);

        if (!vendor) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.VENDOR_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.VENDOR_FETCHED,
            data: vendor,
        });
    } catch (error) {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch vendor",
        });
    }
};

export const editVendor = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getVendorId(req, res);
    if (!id) return res;

    try {
        if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const vendor = await vendorService.editVendor(id, {
            ...req.body,
            updatedBy: new mongoose.Types.ObjectId(req.userId),
            userUpdatedDate: new Date(),
        });

        if (!vendor) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.VENDOR_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.VENDOR_UPDATED,
            data: vendor,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === message.CONTACT_NO_EXISTS
        ) {
            return res.status(statusCode.CONFLICT).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to update vendor",
        });
    }
};

export const deleteVendor = async (
    req: RequestWithAuthData,
    res: Response,
): Promise<Response> => {
    const id = getVendorId(req, res);
    if (!id) return res;

    try {
        if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.AUTHENTICATED_USER_ID_INVALID,
            });
        }

        const vendor = await vendorService.deleteVendor(id, req.userId.toString());

        if (!vendor) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.VENDOR_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.VENDOR_DELETED,
            data: vendor,
        });
    } catch (error) {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to delete vendor",
        });
    }
};
