
import mongoose, { Schema, Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel.js";

export interface PettyCash extends BaseDocument {
    pettyCashBalance: number;
    balanceAfterExpenses: number;
    month: number;
    year: number;
    openingBalance: number;
    totalFundsAdded: number;
    totalExpenses: number;
}

export type PettyCashDocument = PettyCash & Document;

const PettyCashSchema: Schema = new Schema({
    pettyCashBalance: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    balanceAfterExpenses: {
        type: Number,
        required: true,
        default: 0,
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    year: {
        type: Number,
        required: true,
    },
    openingBalance: {
        type: Number,
        required: true,
        default: 0,
    },
    totalFundsAdded: {
        type: Number,
        required: true,
        default: 0,
    },
    totalExpenses: {
        type: Number,
        required: true,
        default: 0,
    },
});

PettyCashSchema.add(BaseSchema);

PettyCashSchema.index(
    { month: 1, year: 1 },
    {
        unique: true,
        partialFilterExpression: { isDeleted: false },
    },
);

export default mongoose.models.PettyCash ||
    mongoose.model<PettyCashDocument>(
        "PettyCash",
        PettyCashSchema,
    );
