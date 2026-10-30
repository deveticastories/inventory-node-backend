import type { Response } from "express";
import type { RequestWithAuthData } from "../../@types/express";
import * as settingsService from "./settingsService";
import { sendError } from "../../utils/errorStatus";

export const getSettings = async (_req: RequestWithAuthData, res: Response) => {
    try {
        const settings = await settingsService.getSettings();

        return res.status(200).json({
            success: true,
            message: "SETTINGS_FETCHED",
            data: settings,
        });
    } catch (error) {
        return sendError(res, error, "GET_SETTINGS_ERROR");
    }
};

export const updateSettings = async (req: RequestWithAuthData, res: Response) => {
    try {
        const settings = await settingsService.updateSettings(
            req.body ?? {},
            req.userId,
        );

        return res.status(200).json({
            success: true,
            message: "SETTINGS_UPDATED",
            data: settings,
        });
    } catch (error) {
        return sendError(res, error, "UPDATE_SETTINGS_ERROR");
    }
};
