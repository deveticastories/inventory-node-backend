import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export type PaidStatus = "Fully Paid" | "Partial Paid";

export interface BillingProduct {
    _id?: mongoose.Types.ObjectId;
    uaeMainStock: mongoose.Types.ObjectId;
    styleNo: string;
    productName: string;
    qty: number;
    unitPrice: number;
    costAED: number;
    amount: number;
}

export interface Billing extends BaseDocument {
    invoiceNo: string;
    date: Date;
    customer: mongoose.Types.ObjectId;
    products: BillingProduct[];
    totalQty: number;
    invoiceTotal: number;
    returnAmount: number;
    netAmount: number;
    receivedAmount: number;
    balanceAmount: number;
    isPaid: boolean;
    paidStatus: PaidStatus;
    paidAmount: number;
}

export type BillingDocument = Billing & Document;

const BillingProductSchema = new Schema<BillingProduct>(
    {
        uaeMainStock: {
            type: Schema.Types.ObjectId,
            ref: "UAEMainStock",
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
        qty: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "BILLING_QTY_INVALID",
            },
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        costAED: {
            type: Number,
            default: 0,
            min: 0,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: true },
);

const BillingSchema = new Schema<BillingDocument>(
    {
        invoiceNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true,
        },
        products: {
            type: [BillingProductSchema],
            required: true,
            validate: {
                validator: (products: BillingProduct[]) =>
                    products.length > 0,
                message: "BILLING_PRODUCTS_REQUIRED",
            },
        },
        totalQty: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        invoiceTotal: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        returnAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        netAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        receivedAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        balanceAmount: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        isPaid: {
            type: Boolean,
            default: false,
            required: true,
        },
        paidStatus: {
            type: String,
            enum: ["Fully Paid", "Partial Paid"],
            default: "Partial Paid",
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true },
);

BillingSchema.add(BaseSchema);

BillingSchema.index({ date: -1 });
BillingSchema.index({ customer: 1, date: -1 });
BillingSchema.index({ isDeleted: 1, date: -1 });

const BillingModel =
    mongoose.models.Billing ||
    mongoose.model<BillingDocument>("Billing", BillingSchema);

export default BillingModel;