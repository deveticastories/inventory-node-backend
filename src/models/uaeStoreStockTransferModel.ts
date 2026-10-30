import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

// A customer return booked into UAE_RETURN STORE against a billing invoice.
// `inStore` is what is still sitting in the return store; it goes down when
// non-damaged stock is moved back to UAE_MAIN STORE.
export type UAEReturnType = "Fully" | "Partial";
export type UAEReturnReason = "Damage" | "Size issue" | "Other";

export interface UAEStoreStockReturnProduct {
    _id?: mongoose.Types.ObjectId;
    billingProduct: mongoose.Types.ObjectId;
    uaeMainStock: mongoose.Types.ObjectId;
    styleNo: string;
    productName: string;
    returnedQty: number;
    unitPrice: number;
    costAED: number;
    returnValue: number;
    inStore: number;
}

export interface UAEStoreStockTransfer extends BaseDocument {
    returnNo: string;
    invoice: mongoose.Types.ObjectId;
    invoiceNo: string;
    returnType: UAEReturnType;
    reason: UAEReturnReason;
    products: mongoose.Types.DocumentArray<
        UAEStoreStockReturnProduct & Document
    >;
    returnDate: Date;
    fromStore?: mongoose.Types.ObjectId;
    toStore?: mongoose.Types.ObjectId;
}

export type UAEStoreStockTransferDocument = UAEStoreStockTransfer & Document;

const UAEStoreStockReturnProductSchema =
    new Schema<UAEStoreStockReturnProduct>(
        {
            billingProduct: {
                type: Schema.Types.ObjectId,
                required: true,
            },
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
            returnedQty: {
                type: Number,
                required: true,
                min: 1,
                validate: {
                    validator: Number.isInteger,
                    message: "RETURNED_QTY_INVALID",
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
            returnValue: {
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
            returnNo: {
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
            invoiceNo: {
                type: String,
                required: true,
                trim: true,
            },
            returnType: {
                type: String,
                enum: ["Fully", "Partial"],
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
            fromStore: {
                type: Schema.Types.ObjectId,
                ref: "Store",
            },
            toStore: {
                type: Schema.Types.ObjectId,
                ref: "Store",
            },
        },
        { timestamps: true },
    );

UAEStoreStockTransferSchema.add(BaseSchema);

UAEStoreStockTransferSchema.index({ invoice: 1, isDeleted: 1 });
UAEStoreStockTransferSchema.index({ returnDate: -1 });

const UAEStoreStockTransferModel =
    mongoose.models.UAEStoreStockTransfer ||
    mongoose.model<UAEStoreStockTransferDocument>(
        "UAEStoreStockTransfer",
        UAEStoreStockTransferSchema,
    );

export default UAEStoreStockTransferModel;
