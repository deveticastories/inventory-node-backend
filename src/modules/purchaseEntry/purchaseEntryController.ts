
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { statusCode } from "../../constants/statusCode";
import { message } from "../../constants/responseMessage";
import type { RequestWithAuthData } from "../../@types/express";
import {
  createPurchaseEntryService,
  getAllPurchaseEntriesService,
  getPurchaseEntryByIdService,
  updatePurchaseEntryService,
  updatePurchaseEntryQCService,
  deletePurchaseEntryService,
} from "./purchaseEntryService";
import { getPaginationParams } from "../../utils/pagination";

const getParamId = (id: string | string[]): string =>
  Array.isArray(id) ? id[0] : id;

export const createPurchaseEntryController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as RequestWithAuthData).userId;

    if (!userId) {
      res.status(statusCode.UNAUTHORIZED).json({
        success: false,
        message: message.PURCHASE_USER_REQUIRED,
      });
      return;
    }

    const purchaseEntry = await createPurchaseEntryService(
      req.body,
      new mongoose.Types.ObjectId(userId),
    );

    res.status(statusCode.CREATED).json({
      success: true,
      message: message.PURCHASE_CREATED,
      data: purchaseEntry,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";

    if (errorMessage === "PURCHASE_VENDOR_NOT_FOUND") {
      res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: message.PURCHASE_VENDOR_NOT_FOUND,
      });
      return;
    }

    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message.PURCHASE_CREATE_FAILED,
    });
  }
};

export const getAllPurchaseEntriesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const result = await getAllPurchaseEntriesService(page, limit);

    res.status(statusCode.OK).json({
      success: true,
      message: message.PURCHASES_FETCHED,
      data: result.data,
      pagination: result.pagination,
    });
  } catch {
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message.PURCHASE_FETCH_FAILED,
    });
  }
};

export const getPurchaseEntryByIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const purchaseEntry = await getPurchaseEntryByIdService(
      getParamId(req.params.id),
    );

    res.status(statusCode.OK).json({
      success: true,
      message: message.PURCHASE_FETCHED,
      data: purchaseEntry,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";

    if (
      errorMessage === "PURCHASE_ID_INVALID" ||
      errorMessage === "PURCHASE_NOT_FOUND"
    ) {
      const isInvalidId = errorMessage === "PURCHASE_ID_INVALID";

      res.status(
        isInvalidId ? statusCode.BAD_REQUEST : statusCode.NOT_FOUND,
      ).json({
        success: false,
        message: isInvalidId
          ? message.PURCHASE_ID_INVALID
          : message.PURCHASE_NOT_FOUND,
      });
      return;
    }

    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message.PURCHASE_FETCH_FAILED,
    });
  }
};

export const updatePurchaseEntryController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as RequestWithAuthData).userId;

    if (!userId) {
      res.status(statusCode.UNAUTHORIZED).json({
        success: false,
        message: message.PURCHASE_USER_REQUIRED,
      });
      return;
    }

    const purchaseEntry = await updatePurchaseEntryService(
      getParamId(req.params.id),
      req.body,
      new mongoose.Types.ObjectId(userId),
    );

    res.status(statusCode.OK).json({
      success: true,
      message: message.PURCHASE_UPDATED,
      data: purchaseEntry,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";

    if (
      errorMessage === "PURCHASE_ID_INVALID" ||
      errorMessage === "PURCHASE_NOT_FOUND" ||
      errorMessage === "PURCHASE_VENDOR_NOT_FOUND"
    ) {
      const isInvalidId = errorMessage === "PURCHASE_ID_INVALID";
      const isVendorNotFound =
        errorMessage === "PURCHASE_VENDOR_NOT_FOUND";

      res.status(
        isInvalidId ? statusCode.BAD_REQUEST : statusCode.NOT_FOUND,
      ).json({
        success: false,
        message: isInvalidId
          ? message.PURCHASE_ID_INVALID
          : isVendorNotFound
            ? message.PURCHASE_VENDOR_NOT_FOUND
            : message.PURCHASE_NOT_FOUND,
      });
      return;
    }

    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message.PURCHASE_UPDATE_FAILED,
    });
  }
};

export const updatePurchaseEntryQCController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const purchaseEntry = await updatePurchaseEntryQCService(
      getParamId(req.params.id),
      req.body.qcStatus,
    );

    res.status(statusCode.OK).json({
      success: true,
      message: message.PURCHASE_QC_UPDATED,
      data: purchaseEntry,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";

    if (
      errorMessage === "PURCHASE_ID_INVALID" ||
      errorMessage === "PURCHASE_NOT_FOUND"
    ) {
      const isInvalidId = errorMessage === "PURCHASE_ID_INVALID";

      res.status(
        isInvalidId ? statusCode.BAD_REQUEST : statusCode.NOT_FOUND,
      ).json({
        success: false,
        message: isInvalidId
          ? message.PURCHASE_ID_INVALID
          : message.PURCHASE_NOT_FOUND,
      });
      return;
    }

    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message.PURCHASE_QC_FAILED,
    });
  }
};

export const deletePurchaseEntryController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as RequestWithAuthData).userId;

    if (!userId) {
      res.status(statusCode.UNAUTHORIZED).json({
        success: false,
        message: message.PURCHASE_USER_REQUIRED,
      });
      return;
    }

    const purchaseEntry = await deletePurchaseEntryService(
      getParamId(req.params.id),
      new mongoose.Types.ObjectId(userId),
    );

    res.status(statusCode.OK).json({
      success: true,
      message: message.PURCHASE_DELETED,
      data: purchaseEntry,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";

    if (
      errorMessage === "PURCHASE_ID_INVALID" ||
      errorMessage === "PURCHASE_NOT_FOUND"
    ) {
      const isInvalidId = errorMessage === "PURCHASE_ID_INVALID";

      res.status(
        isInvalidId ? statusCode.BAD_REQUEST : statusCode.NOT_FOUND,
      ).json({
        success: false,
        message: isInvalidId
          ? message.PURCHASE_ID_INVALID
          : message.PURCHASE_NOT_FOUND,
      });
      return;
    }

    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message.PURCHASE_DELETE_FAILED,
    });
  }
};
