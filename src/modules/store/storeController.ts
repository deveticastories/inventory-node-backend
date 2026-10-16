import type { Response } from "express";
import mongoose from "mongoose";
import type { RequestWithAuthData } from "../../@types/express";
import * as storeService from "./storeService";
import { getPaginationParams } from "../../utils/pagination";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";

const getStoreId = (
  req: RequestWithAuthData,
  res: Response,
): string | null => {
  const id = req.params.id;

  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    res.status(statusCode.BAD_REQUEST).json({
      success: false,
      message: "Invalid store ID",
    });
    return null;
  }

  return id;
};

export const createStore = async (
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

    const store = await storeService.createStore(
      req.body,
      new mongoose.Types.ObjectId(req.userId),
    );

    return res.status(statusCode.CREATED).json({
      success: true,
      message: "Store created successfully",
      data: store,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create store";

    const status =
      errorMessage.includes("already exists")
        ? statusCode.CONFLICT
        : errorMessage === "Assigned user not found"
          ? statusCode.BAD_REQUEST
          : statusCode.BAD_REQUEST;

    return res.status(status).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const getAllStores = async (
  req: RequestWithAuthData,
  res: Response,
): Promise<Response> => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const result = await storeService.getAllStores(page, limit);

    return res.status(statusCode.OK).json({
      success: true,
      message: "Stores fetched successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(statusCode.BAD_REQUEST).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch stores",
    });
  }
};

export const getStoreById = async (
  req: RequestWithAuthData,
  res: Response,
): Promise<Response> => {
  const id = getStoreId(req, res);

  if (!id) return res;

  try {
    const store = await storeService.getStoreById(id);

    if (!store) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Store not found",
      });
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: "Store fetched successfully",
      data: store,
    });
  } catch (error) {
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch store",
    });
  }
};

export const editStore = async (
  req: RequestWithAuthData,
  res: Response,
): Promise<Response> => {
  const id = getStoreId(req, res);

  if (!id) return res;

  try {
    if (!req.userId) {
      return res.status(statusCode.UNAUTHORIZED).json({
        success: false,
        message: message.AUTHENTICATED_USER_ID_INVALID,
      });
    }

    const store = await storeService.editStore(
      id,
      req.body,
      new mongoose.Types.ObjectId(req.userId),
    );

    if (!store) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Store not found",
      });
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: "Store updated successfully",
      data: store,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update store";

    const status =
      errorMessage.includes("already exists")
        ? statusCode.CONFLICT
        : errorMessage === "Assigned user not found"
          ? statusCode.BAD_REQUEST
          : statusCode.BAD_REQUEST;

    return res.status(status).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const deleteStore = async (
  req: RequestWithAuthData,
  res: Response,
): Promise<Response> => {
  const id = getStoreId(req, res);

  if (!id) return res;

  try {
    if (!req.userId || !mongoose.isValidObjectId(req.userId)) {
      return res.status(statusCode.UNAUTHORIZED).json({
        success: false,
        message: message.AUTHENTICATED_USER_ID_INVALID,
      });
    }

    const store = await storeService.deleteStore(
      id,
      new mongoose.Types.ObjectId(req.userId),
    );

    if (!store) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "Store not found",
      });
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: "Store deleted successfully",
      data: store,
    });
  } catch (error) {
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete store",
    });
  }
};
