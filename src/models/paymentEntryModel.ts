
import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface PaymentEntry extends BaseDocument {
    paymentVoucherNo: string;
    purchaseInvoice: mongoose.Types.ObjectId;
    paidAmount: number;
    balanceAmount: number;
}

export type PaymentEntryDocument = PaymentEntry & Document;

const PaymentEntrySchema = new Schema<PaymentEntryDocument>(
    {
        paymentVoucherNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        purchaseInvoice: {
            type: Schema.Types.ObjectId,
            ref: "PurchaseEntry",
            required: true,
            index: true,
        },
        paidAmount: {
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

PaymentEntrySchema.add(BaseSchema);

PaymentEntrySchema.index({ purchaseInvoice: 1, isDeleted: 1 });

const PaymentEntryModel =
    mongoose.models.PaymentEntry ||
    mongoose.model<PaymentEntryDocument>(
        "PaymentEntry",
        PaymentEntrySchema,
    );

export default PaymentEntryModel;
