
import mongoose, { Schema, Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel.js";

export interface FundEntry extends BaseDocument {
    amount: number;
    description: string;
    fundDate: Date;
}

export type FundEntryDocument = FundEntry & Document;

const FundEntrySchema = new Schema<FundEntryDocument>(
    {
        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        fundDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true },
);

FundEntrySchema.add(BaseSchema);

const FundEntryModel =
    mongoose.models.FundEntry ||
    mongoose.model<FundEntryDocument>(
        "FundEntry",
        FundEntrySchema,
    );

export default FundEntryModel;
