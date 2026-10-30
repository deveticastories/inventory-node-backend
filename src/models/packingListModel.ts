import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

// Stock taken from TRP_MAIN STORE for one style, oldest purchase first.
export interface PackingStyleAllocation {
    qualityCheckProduct: mongoose.Types.ObjectId;
    purchaseEntry: mongoose.Types.ObjectId;
    qty: number;
    rate: number;
}

export interface PackingStyle {
    styleNo: string;
    productName: string;
    vendor: mongoose.Types.ObjectId;
    qty: number;
    // Weighted INR unit rate of the allocated purchase lines
    rate: number;
    allocations: PackingStyleAllocation[];
    transit: {
        perPcAED: number;
        expenseRecAED: number;
        updatedUnitRateAED: number;
    };
    sellingPriceAED: number;
    moved: boolean;
    transferDate?: Date;
    // Legacy references (packing used to require an IND store transfer)
    indianStoreStockTransfer?: mongoose.Types.ObjectId;
    indianStoreStockTransferProduct?: mongoose.Types.ObjectId;
}

export type PackingStyleDocument = PackingStyle & Document;

export type PackingListStatus =
    | "Pending"
    | "In Transit queue"
    | "Completed";

export interface PackingList extends BaseDocument {
    packingId?: string;
    packingDate: Date;
    salary: number;
    totalQty: number;
    totalExpense: number;
    styles: mongoose.Types.DocumentArray<PackingStyleDocument>;
    dailyExpenses: mongoose.Types.ObjectId[];
    packingListStatus: PackingListStatus;
}

export type PackingListDocument = PackingList & Document;

const PackingStyleAllocationSchema = new Schema<PackingStyleAllocation>(
    {
        qualityCheckProduct: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        purchaseEntry: {
            type: Schema.Types.ObjectId,
            ref: "PurchaseEntry",
            required: true,
        },
        qty: {
            type: Number,
            required: true,
            min: 1,
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false },
);

const PackingStyleSchema: Schema<PackingStyle> = new Schema(
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
        vendor: {
            type: Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        allocations: {
            type: [PackingStyleAllocationSchema],
            default: [],
        },
        sellingPriceAED: {
            type: Number,
            default: 0,
            min: 0,
        },
        moved: {
            type: Boolean,
            default: false,
        },
        transferDate: {
            type: Date,
        },
        indianStoreStockTransfer: {
            type: Schema.Types.ObjectId,
            ref: "IndianStoreStockTransfer",
        },
        indianStoreStockTransferProduct: {
            type: Schema.Types.ObjectId,
        },
        transit: {
            type: new Schema(
                {
                    perPcAED: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                    expenseRecAED: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                    updatedUnitRateAED: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                },
                { _id: false },
            ),
            default: () => ({}),
        },
        qty: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: true },
);

const PackingListSchema: Schema<PackingListDocument> = new Schema(
    {
        packingId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        packingDate: {
            type: Date,
            required: true,
        },
        salary: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        totalQty: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalExpense: {
            type: Number,
            default: 0,
            min: 0,
        },
        styles: {
            type: [PackingStyleSchema],
            default: [],
        },
        dailyExpenses: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "DailyExpense",
                },
            ],
            default: [],
        },
        packingListStatus: {
            type: String,
            enum: ["Pending", "In Transit queue", "Completed"],
            default: "In Transit queue",
        },
    },
);

PackingListSchema.add(BaseSchema);

PackingListSchema.index({ packingDate: -1 });
PackingListSchema.index({ packingListStatus: 1 });
PackingListSchema.index({ "styles.styleNo": 1 });
PackingListSchema.index({
    "styles.allocations.qualityCheckProduct": 1,
});

const PackingListModel =
    mongoose.models.PackingList ||
    mongoose.model<PackingListDocument>(
        "PackingList",
        PackingListSchema,
    );

export default PackingListModel;
