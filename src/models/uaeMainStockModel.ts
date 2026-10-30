import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

// One row per style sitting in UAE_MAIN STORE. Rows are created when a
// packing style is transferred from Transit and topped up when returned
// stock is moved back from UAE_RETURN STORE. Billing reduces `qty`.
export interface UAEMainStock extends BaseDocument {
    styleNo: string;
    productName: string;
    qty: number;
    costAED: number;
    sellingPriceAED: number;
    transitDate: Date;
    packingList?: mongoose.Types.ObjectId;
    packingStyle?: mongoose.Types.ObjectId;
}

export type UAEMainStockDocument = UAEMainStock & Document;

const UAEMainStockSchema = new Schema<UAEMainStockDocument>(
    {
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
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "UAE_STOCK_QTY_INVALID",
            },
        },
        costAED: {
            type: Number,
            required: true,
            min: 0,
        },
        sellingPriceAED: {
            type: Number,
            required: true,
            min: 0,
        },
        transitDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        packingList: {
            type: Schema.Types.ObjectId,
            ref: "PackingList",
        },
        packingStyle: {
            type: Schema.Types.ObjectId,
        },
    },
    { timestamps: true },
);

UAEMainStockSchema.add(BaseSchema);

UAEMainStockSchema.index(
    { styleNo: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } },
);
UAEMainStockSchema.index({ transitDate: -1 });

const UAEMainStockModel =
    mongoose.models.UAEMainStock ||
    mongoose.model<UAEMainStockDocument>("UAEMainStock", UAEMainStockSchema);

export default UAEMainStockModel;
