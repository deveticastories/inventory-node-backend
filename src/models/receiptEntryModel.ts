
import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface ReceiptEntry extends BaseDocument {
    receiptNo: string;
    invoice: mongoose.Types.ObjectId;
    customer: mongoose.Types.ObjectId;
    receiptDate: Date;
    receivableAmount: number;
    receivedAmount: number;
    balanceAmount: number;
}

export type ReceiptEntryDocument = ReceiptEntry & Document;

const ReceiptEntrySchema = new Schema<ReceiptEntryDocument>(
    {
        receiptNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        invoice: {
            type: Schema.Types.ObjectId,
            ref: "Billing",
            required: true,
            index: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            index: true,
        },
        receiptDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        receivableAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        receivedAmount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        balanceAmount: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { timestamps: true },
);

ReceiptEntrySchema.add(BaseSchema);

ReceiptEntrySchema.index({ invoice: 1, isDeleted: 1 });
ReceiptEntrySchema.index({ createdAt: -1 });

const ReceiptEntryModel =
    mongoose.models.ReceiptEntry ||
    mongoose.model<ReceiptEntryDocument>(
        "ReceiptEntry",
        ReceiptEntrySchema,
    );

export default ReceiptEntryModel;
