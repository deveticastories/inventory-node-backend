import mongoose from "mongoose";
import SettingModel, { DEFAULT_SETTING_KEY } from "../../models/settingModel";

export const getSettings = async () => {
    return SettingModel.findOneAndUpdate(
        { key: DEFAULT_SETTING_KEY },
        { $setOnInsert: { key: DEFAULT_SETTING_KEY } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
};

export const updateSettings = async (
    data: { exchangeRate?: unknown; profitPercent?: unknown },
    updatedBy?: mongoose.Types.ObjectId,
) => {
    const update: Record<string, unknown> = { updatedBy };

    if (data.exchangeRate !== undefined) {
        const exchangeRate = Number(data.exchangeRate);

        if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
            throw new Error("EXCHANGE_RATE_INVALID");
        }

        update.exchangeRate = exchangeRate;
    }

    if (data.profitPercent !== undefined) {
        const profitPercent = Number(data.profitPercent);

        if (!Number.isFinite(profitPercent) || profitPercent < 0) {
            throw new Error("PROFIT_PERCENT_INVALID");
        }

        update.profitPercent = profitPercent;
    }

    return SettingModel.findOneAndUpdate(
        { key: DEFAULT_SETTING_KEY },
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    ).lean();
};
