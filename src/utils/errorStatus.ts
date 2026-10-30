import type { Response } from "express";
import mongoose from "mongoose";
import { statusCode } from "../constants/statusCode";
import logger from "./logger";

const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]+$/;

/**
 * Maps the UPPER_SNAKE error codes thrown by services to an HTTP status.
 * *_NOT_FOUND -> 404, duplicates / already-done -> 409, other codes -> 400,
 * anything else (unexpected errors) -> 500.
 */
export const getErrorStatus = (error: unknown): number => {
    if (
        error instanceof mongoose.Error.ValidationError ||
        error instanceof mongoose.Error.CastError
    ) {
        return statusCode.BAD_REQUEST;
    }

    if (!(error instanceof Error) || !ERROR_CODE_PATTERN.test(error.message)) {
        return statusCode.INTERNAL_SERVER_ERROR;
    }

    if (error.message.endsWith("NOT_FOUND")) return statusCode.NOT_FOUND;

    if (
        error.message.startsWith("DUPLICATE_") ||
        error.message.includes("ALREADY")
    ) {
        return statusCode.CONFLICT;
    }

    return statusCode.BAD_REQUEST;
};

export const sendError = (res: Response, error: unknown, operation: string) => {
    const status = getErrorStatus(error);
    const errorMessage =
        status === statusCode.INTERNAL_SERVER_ERROR
            ? "INTERNAL_SERVER_ERROR"
            : (error as Error).message;

    logger.error(`${operation}: ${error instanceof Error ? error.message : error}`);

    return res.status(status).json({
        success: false,
        message: errorMessage,
    });
};

export const round2 = (value: number) =>
    Math.round((value + Number.EPSILON) * 100) / 100;
