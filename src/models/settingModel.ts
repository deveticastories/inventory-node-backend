import mongoose, { Schema, type Document } from "mongoose";

// Single-document collection holding the transit rates used by the
// Transit screen: 1 AED = exchangeRate INR, selling price = cost + profit %.
export interface Setting {
    key: string;
    exchangeRate: number;
    profitPercent: number;
    updatedBy?: mongoose.Types.ObjectId;
}

export type SettingDocument = Setting & Document;

export const DEFAULT_SETTING_KEY = "default";

const SettingSchema = new Schema<SettingDocument>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: DEFAULT_SETTING_KEY,
        },
        exchangeRate: {
            type: Number,
            required: true,
            min: 0.0001,
            default: 22.7,
        },
        profitPercent: {
            type: Number,
            required: true,
            min: 0,
            default: 25,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true },
);

const SettingModel =
    mongoose.models.Setting ||
    mongoose.model<SettingDocument>("Setting", SettingSchema);

export default SettingModel;
