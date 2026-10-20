import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface IndianStoreStockTransferProduct {
    _id?: mongoose.Types.ObjectId;
    qualityCheckProduct: mongoose.Types.ObjectId;
    productName: string;
    transferredQty: number;
    availableQty: number;
    rate: number;
    total: number;
}

export interface IndianStoreStockTransfer extends BaseDocument {
    fromStore: mongoose.Types.ObjectId;
    toStore: mongoose.Types.ObjectId;
    products: IndianStoreStockTransferProduct[];
    transferDate: Date;
    stockValue: number;
}

export type IndianStoreStockTransferDocument =
    IndianStoreStockTransfer & Document;

const IndianStoreStockTransferProductSchema: Schema =
    new Schema({
        qualityCheckProduct: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        productName: {
            type: String,
            required: true,
            trim: true,
        },
        transferredQty: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Transferred quantity must be an integer",
            },
        },
        availableQty: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "Available quantity must be an integer",
            },
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
        },
        total: {
            type: Number,
            default: 0,
            min: 0,
        },
    });

const IndianStoreStockTransferSchema: Schema<IndianStoreStockTransfer> =
    new Schema(
        {
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
            products: {
                type: [IndianStoreStockTransferProductSchema],
                required: true,
                validate: {
                    validator: (
                        products: IndianStoreStockTransferProduct[],
                    ) => products.length > 0,
                    message: "At least one product is required",
                },
            },
            transferDate: {
                type: Date,
                required: true,
                default: Date.now,
            },
            stockValue: {
                type: Number,
                default: 0,
                min: 0,
            },
        },
        { timestamps: true },
    );

IndianStoreStockTransferSchema.add(BaseSchema);

IndianStoreStockTransferSchema.pre("validate", function () {
    if (
        this.fromStore &&
        this.toStore &&
        this.fromStore.equals(this.toStore)
    ) {
        this.invalidate(
            "toStore",
            "Source and destination stores must be different",
        );
    }

    let stockValue = 0;

    for (const product of this.products) {
        product.total = product.transferredQty * product.rate;
        stockValue += product.total;
    }

    this.stockValue = stockValue;
});

IndianStoreStockTransferSchema.index({ transferDate: -1 });
IndianStoreStockTransferSchema.index({ fromStore: 1 });
IndianStoreStockTransferSchema.index({ toStore: 1 });

const IndianStoreStockTransferModel =
    mongoose.models.IndianStoreStockTransfer ||
    mongoose.model<IndianStoreStockTransferDocument>(
        "IndianStoreStockTransfer",
        IndianStoreStockTransferSchema,
    );

export default IndianStoreStockTransferModel;