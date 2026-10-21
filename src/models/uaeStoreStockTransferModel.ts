import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export type UAEReturnType = "Fully" | "Partially";
export type UAEReturnReason = "Damage" | "Size issue" | "Other";

export interface UAEStoreStockReturnProduct {
    packingList: mongoose.Types.ObjectId;
    packingStyle: mongoose.Types.ObjectId;
    styleNo: string;
    productName: string;
    returnedQty: number;
    invoiceNo: string;
    invoiceValue: number;
    updatedInvoiceValue: number;
    inStore: number;
}

export interface UAEStoreStockTransfer extends BaseDocument {
    packingList: mongoose.Types.ObjectId;
    fromStore: mongoose.Types.ObjectId;
    toStore: mongoose.Types.ObjectId;
    returnType: UAEReturnType;
    reason: UAEReturnReason;
    products: UAEStoreStockReturnProduct[];
    returnDate: Date;
}

export type UAEStoreStockTransferDocument = UAEStoreStockTransfer & Document;

const UAEStoreStockReturnProductSchema =
    new Schema<UAEStoreStockReturnProduct>(
        {
            packingList: {
                type: Schema.Types.ObjectId,
                ref: "PackingList",
                required: true,
            },
            packingStyle: {
                type: Schema.Types.ObjectId,
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
            returnedQty: {
                type: Number,
                required: true,
                min: 1,
                validate: {
                    validator: Number.isInteger,
                    message: "RETURNED_QTY_INVALID",
                },
            },
            invoiceNo: {
                type: String,
                required: true,
                trim: true,
            },
            invoiceValue: {
                type: Number,
                required: true,
                min: 0,
            },
            updatedInvoiceValue: {
                type: Number,
                required: true,
                min: 0,
            },
            inStore: {
                type: Number,
                required: true,
                min: 0,
            },
        },
        { _id: true },
    );

const UAEStoreStockTransferSchema =
    new Schema<UAEStoreStockTransferDocument>(
        {
            packingList: {
                type: Schema.Types.ObjectId,
                ref: "PackingList",
                required: true,
                index: true,
            },
            fromStore: {
                type: Schema.Types.ObjectId,
                ref: "Store",
                required: true,
            },
            toStore: {
                type: Schema.Types.ObjectId,
                ref: "Store",
                required: true,
            },
            returnType: {
                type: String,
                enum: ["Fully", "Partially"],
                required: true,
            },
            reason: {
                type: String,
                enum: ["Damage", "Size issue", "Other"],
                required: true,
            },
            products: {
                type: [UAEStoreStockReturnProductSchema],
                required: true,
                validate: {
                    validator: (products: UAEStoreStockReturnProduct[]) =>
                        products.length > 0,
                    message: "RETURN_PRODUCTS_REQUIRED",
                },
            },
            returnDate: {
                type: Date,
                required: true,
                default: Date.now,
            },
        },
        { timestamps: true },
    );

UAEStoreStockTransferSchema.add(BaseSchema);

UAEStoreStockTransferSchema.index({
    packingList: 1,
    isDeleted: 1,
});
UAEStoreStockTransferSchema.index({
    fromStore: 1,
    isDeleted: 1,
});
UAEStoreStockTransferSchema.index({
    toStore: 1,
    isDeleted: 1,
});

const UAEStoreStockTransferModel =
    mongoose.models.UAEStoreStockTransfer ||
    mongoose.model<UAEStoreStockTransferDocument>(
        "UAEStoreStockTransfer",
        UAEStoreStockTransferSchema,
    );

export default UAEStoreStockTransferModel;