
import { Response } from "express";
import * as userService from "./userService";
import { message } from "../../constants/responseMessage";
import { RequestWithAuthData } from "../../@types/express";
import { statusCode } from "../../constants/statusCode";
import { paginatedResponse } from "../../utils/response";
import { getPaginationParams } from "../../utils/pagination";

export const createUser = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        if (!req.userId) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.UNAUTHORIZED,
            });
        }

        const userData = {
            ...req.body,
            createdBy: req.userId,
        };

        const createdUser = await userService.createUser(userData);

        return res.status(statusCode.CREATED).json({
            success: true,
            message: message.USER_CREATED,
            user: createdUser,
        });
    } catch (error: any) {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

export const editUser = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    const { id } = req.params;

    if (!req.userId) {
        return res.status(statusCode.UNAUTHORIZED).json({
            success: false,
            message: message.UNAUTHORIZED,
        });
    }

    if (typeof id !== "string") {
        return res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: message.INVALID_USER_ID,
        });
    }

    try {
        const existingUser = await userService.getUserById(id);

        if (!existingUser) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.USER_NOT_FOUND,
            });
        }

        const userData = {
            ...req.body,
            updatedBy: req.userId,
            userUpdatedDate: new Date(),
        };

        const updatedUser = await userService.editUser(id, userData);

        return res.status(statusCode.OK).json({
            success: true,
            message: message.USER_UPDATED,
            user: updatedUser,
        });
    } catch (error: any) {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteUser = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    const { id } = req.params;

    try {
        if (!req.userId) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.UNAUTHORIZED,
            });
        }

        if (typeof id !== "string") {
            return res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: message.INVALID_USER_ID,
            });
        }

        const deletedUser = await userService.deleteUser(
            id,
            req.userId,
        );

        if (!deletedUser) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.USER_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.USER_DELETED,
        });
    } catch (error: any) {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

export const getUserById = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    const { id } = req.params;

    try {
        if (!req.userId) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.UNAUTHORIZED,
            });
        }

        if (typeof id !== "string") {
            return res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: message.INVALID_USER_ID,
            });
        }

        const user = await userService.getUserById(id);

        if (!user) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.USER_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            user,
        });
    } catch (error: any) {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAllUsers = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    try {
        if (!req.userId) {
            return res.status(statusCode.UNAUTHORIZED).json({
                success: false,
                message: message.UNAUTHORIZED,
            });
        }

        let paginationParams;

        try {
            paginationParams = getPaginationParams(req.query);
        } catch (error: any) {
            return res.status(statusCode.BAD_REQUEST).json({
                success: false,
                message: error.message,
            });
        }

        const result = await userService.getAllUsers(
            paginationParams.page,
            paginationParams.limit,
        );

        return res.status(statusCode.OK).json(
            paginatedResponse(result.data, result.pagination),
        );
    } catch (error: any) {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};
export const updateUserStatus = async (
    req: RequestWithAuthData,
    res: Response,
) => {
    const { id } = req.params;

    if (!req.userId) {
        return res.status(statusCode.UNAUTHORIZED).json({
            success: false,
            message: message.UNAUTHORIZED,
        });
    }

    if (typeof id !== "string") {
        return res.status(statusCode.BAD_REQUEST).json({
            success: false,
            message: message.INVALID_USER_ID,
        });
    }

    try {
        const userStatusUpdateData = {
            ...req.body,
            updatedBy: req.userId,
            userUpdatedDate: new Date(),
        };

        const updatedUser = await userService.updateUserStatus(
            id,
            userStatusUpdateData,
        );

        if (!updatedUser) {
            return res.status(statusCode.NOT_FOUND).json({
                success: false,
                message: message.USER_NOT_FOUND,
            });
        }

        return res.status(statusCode.OK).json({
            success: true,
            message: message.USER_STATUS_UPDATED,
            user: updatedUser,
        });
    } catch (error: any) {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};
