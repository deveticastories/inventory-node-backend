
import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface StoreStockTransferProduct {
    purchaseEntry: mongoose.Types.ObjectId;
    productName: string;
    qty: number;
    rate: number;
    total: number;
}

export interface StoreStockTransferStore {
    storeName: string;
    products: StoreStockTransferProduct[];
}

export interface StoreStockTransfer extends BaseDocument {
    stores: StoreStockTransferStore[];
    transferDate: Date;
    stockValue: number;
}

export type StoreStockTransferDocument =
    StoreStockTransfer & Document;

const StoreStockTransferProductSchema: Schema<StoreStockTransferProduct> =
    new Schema<StoreStockTransferProduct>(
        {
            purchaseEntry: {
                type: Schema.Types.ObjectId,
                ref: "PurchaseEntry",
                required: true,
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
                    message: "Quantity must be a whole number",
                },
            },
            rate: {
                type: Number,
                required: true,
                min: 0,
            },
            total: {
                type: Number,
                required: true,
                min: 0,
                default: 0,
            },
        },
        { _id: false },
    );

const StoreStockTransferStoreSchema: Schema<StoreStockTransferStore> =
    new Schema<StoreStockTransferStore>(
        {
            storeName: {
                type: String,
                required: true,
                trim: true,
            },
            products: {
                type: [StoreStockTransferProductSchema],
                required: true,
                validate: {
                    validator: (products: StoreStockTransferProduct[]) =>
                        products.length > 0,
                    message: "At least one product is required",
                },
            },
        },
        { _id: false },
    );

const StoreStockTransferSchema: Schema<StoreStockTransferDocument> =
    new Schema<StoreStockTransferDocument>({
        stores: {
            type: [StoreStockTransferStoreSchema],
            required: true,
            validate: {
                validator: (stores: StoreStockTransferStore[]) =>
                    stores.length > 0,
                message: "At least one store is required",
            },
        },
        transferDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        stockValue: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
    });

StoreStockTransferSchema.pre("validate", function () {
    let stockValue = 0;

    for (const store of this.stores) {
        for (const product of store.products) {
            product.total = product.qty * product.rate;
            stockValue += product.total;
        }
    }

    this.stockValue = stockValue;
});
StoreStockTransferSchema.pre("validate", function () {
    let stockValue = 0;

    for (const store of this.stores) {
        for (const product of store.products) {
            product.total = product.qty * product.rate;
            stockValue += product.total;
        }
    }

    this.stockValue = stockValue;
});

StoreStockTransferSchema.add(BaseSchema);

StoreStockTransferSchema.index({
    transferDate: -1,
});

const StoreStockTransferModel =
    mongoose.models.StoreStockTransfer ||
    mongoose.model<StoreStockTransferDocument>(
        "StoreStockTransfer",
        StoreStockTransferSchema,
    );

export default StoreStockTransferModel;
