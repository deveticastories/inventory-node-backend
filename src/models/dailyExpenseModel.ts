
import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export type ExpensePaymentMode = "Cash" | "Upi" | "Account";

export interface DailyExpense extends BaseDocument {
    date: Date;
    expenseType: string;
    paymentType: ExpensePaymentMode;
    amount: number;
    description?: string;
    packingId: string;
}

export type DailyExpenseDocument = DailyExpense & Document;

const DailyExpenseSchema: Schema<DailyExpenseDocument> =
    new Schema<DailyExpenseDocument>({
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expenseType: {
            type: String,
            required: true,
            trim: true,
        },
        paymentType: {
            type: String,
            enum: ["Cash", "Upi", "Account"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        packingId: {
            type: String,
            default: "Open",
            trim: true,
        },
    });

DailyExpenseSchema.add(BaseSchema);

DailyExpenseSchema.index({ date: -1 });
DailyExpenseSchema.index({ expenseType: 1 });
DailyExpenseSchema.index({ packingId: 1 });

const DailyExpenseModel =
    mongoose.models.DailyExpense ||
    mongoose.model<DailyExpenseDocument>(
        "DailyExpense",
        DailyExpenseSchema,
    );

export default DailyExpenseModel;
