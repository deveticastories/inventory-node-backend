
import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface PurchaseEntryProduct {
    _id?: mongoose.Types.ObjectId;
    productName: string;
    purchaseQty: number;
    purchaseRate: number;
    amount: number;
}

export interface PurchaseEntry extends BaseDocument {
    invoiceNo: string;
    purchaseDate: Date;
    vendor: mongoose.Types.ObjectId;
    products: mongoose.Types.DocumentArray<PurchaseEntryProduct>;
    totalProductQty: number;
    totalAmount: number;
    totalIncludingGST: number;
    qcStatus: "Pending" | "Done";
}

export type PurchaseEntryDocument = PurchaseEntry & Document;

const PurchaseEntryProductSchema = new Schema<PurchaseEntryProduct>(
    {
        productName: {
            type: String,
            required: true,
            trim: true,
        },
        purchaseQty: {
            type: Number,
            required: true,
            min: 1,
        },
        purchaseRate: {
            type: Number,
            required: true,
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

const PurchaseEntrySchema = new Schema<PurchaseEntryDocument>(
    {
        invoiceNo: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        purchaseDate: {
            type: Date,
            required: true,
        },
        vendor: {
            type: Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },
        products: {
            type: [PurchaseEntryProductSchema],
            required: true,
            validate: {
                validator: (products: PurchaseEntryProduct[]) =>
                    products.length > 0,
                message: "At least one product is required",
            },
        },
        totalProductQty: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        totalIncludingGST: {
            type: Number,
            required: true,
            min: 0,
        },
        qcStatus: {
            type: String,
            enum: ["Pending", "Done"],
            default: "Pending",
            required: true,
        },
    },
);

PurchaseEntrySchema.add(BaseSchema);

const PurchaseEntryModel =
    mongoose.models.PurchaseEntry ||
    mongoose.model<PurchaseEntryDocument>(
        "PurchaseEntry",
        PurchaseEntrySchema,
    );

export default PurchaseEntryModel;
