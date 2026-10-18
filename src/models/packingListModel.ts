
import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface PackingStyle {
    date: Date;
    styleNo: string;
    productName: string;
    vendorName: mongoose.Types.ObjectId;
    qty: number;
    availableQuantity: number;
}

export type PackingListStatus =
    | "Pending"
    | "In Transit queue"
    | "Completed";

export interface PackingList extends BaseDocument {
    packingId?: string;
    packingDate: Date;
    salary: number;
    totalQty: number;
    totalExpense: number;
    styles: PackingStyle[];
    dailyExpenses: mongoose.Types.ObjectId[];
    packingListStatus: PackingListStatus;
}

export type PackingListDocument = PackingList & Document;

const PackingStyleSchema: Schema<PackingStyle> = new Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        styleNo: {
            type: String,
            required: true,
            trim: true,
        },
        productName: {
            type: String,
            required: true,
            trim: true,
        },
        vendorName: {
            type: Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },
        qty: {
            type: Number,
            required: true,
            min: 1,
        },
        availableQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
    },
    { _id: true }
);

const PackingListSchema: Schema<PackingListDocument> = new Schema(
    {
        packingId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        packingDate: {
            type: Date,
            required: true,
        },
        salary: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        totalQty: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalExpense: {
            type: Number,
            default: 0,
            min: 0,
        },
        styles: {
            type: [PackingStyleSchema],
            default: [],
        },
        dailyExpenses: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "DailyExpense",
                },
            ],
            default: [],
        },
        packingListStatus: {
            type: String,
            enum: ["Pending", "In Transit queue", "Completed"],
            default: "In Transit queue",
        },
    }
);

PackingListSchema.add(BaseSchema);

PackingListSchema.index({ packingDate: -1 });
PackingListSchema.index({ packingListStatus: 1 });

const PackingListModel =
    mongoose.models.PackingList ||
    mongoose.model<PackingListDocument>(
        "PackingList",
        PackingListSchema
    );

export default PackingListModel;
