
import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface PaymentEntry extends BaseDocument {
    paymentVoucherNo: string;
    purchaseInvoice: mongoose.Types.ObjectId;
    purchaseInvoiceNo: string;
    purchaseInvoiceDate: Date;
    vendor: mongoose.Types.ObjectId;
    vendorName: string;
    payableAmount: number;
    paidAmount: number;
    balanceAmount: number;
    paidDate: Date;
}

export type PaymentEntryDocument = PaymentEntry & Document;

const PaymentEntrySchema: Schema<PaymentEntryDocument> = new Schema(
    {
        paymentVoucherNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        purchaseInvoice: {
            type: Schema.Types.ObjectId,
            ref: "PurchaseInvoice",
            required: true,
        },
        purchaseInvoiceNo: {
            type: String,
            required: true,
            trim: true,
        },
        purchaseInvoiceDate: {
            type: Date,
            required: true,
        },
        vendor: {
            type: Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },
        vendorName: {
            type: String,
            required: true,
            trim: true,
        },
        payableAmount: {
            type: Number,
            required: true,
            min: 0,
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
        paidDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true }
);

PaymentEntrySchema.add(BaseSchema);

PaymentEntrySchema.index({ purchaseInvoice: 1, isDeleted: 1 });
PaymentEntrySchema.index({ paidDate: -1 });

const PaymentEntryModel =
    mongoose.models.PaymentEntry ||
    mongoose.model<PaymentEntryDocument>(
        "PaymentEntry",
        PaymentEntrySchema
    );

export default PaymentEntryModel;
