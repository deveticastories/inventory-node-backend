
import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface PurchaseQualityCheckProduct {
  productName: string;
  totalQty: number;
  purchaseRate: number;
  damageQty: number;
  approvedQty: number;
  availableQtyAfterQC: number;
  payableAfterQC: number;
}

export interface PurchaseQualityCheck extends BaseDocument {
  purchaseEntry: mongoose.Types.ObjectId;
  products: PurchaseQualityCheckProduct[];
  totalApprovedQty: number;
  totalDamagedQty: number;
  availableQtyAfterQC: number;
  payableAfterQC: number;
  checkedBy: mongoose.Types.ObjectId;
}

export type PurchaseQualityCheckDocument =
  PurchaseQualityCheck & Document;

const PurchaseQualityCheckProductSchema: Schema<PurchaseQualityCheckProduct> =
  new Schema<PurchaseQualityCheckProduct>(
    {
      productName: {
        type: String,
        required: true,
        trim: true,
      },
      totalQty: {
        type: Number,
        required: true,
        min: 0,
      },
      purchaseRate: {
        type: Number,
        required: true,
        min: 0,
      },
      damageQty: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      approvedQty: {
        type: Number,
        required: true,
        min: 0,
      },
      availableQtyAfterQC: {
        type: Number,
        required: true,
        min: 0,
      },
      payableAfterQC: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    { _id: false },
  );

const PurchaseQualityCheckSchema: Schema<PurchaseQualityCheckDocument> =
  new Schema<PurchaseQualityCheckDocument>({
    purchaseEntry: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseEntry",
      required: true,
      unique: true,
    },
    products: {
      type: [PurchaseQualityCheckProductSchema],
      required: true,
    },
    totalApprovedQty: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalDamagedQty: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    availableQtyAfterQC: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    payableAfterQC: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    checkedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  });

PurchaseQualityCheckSchema.add(BaseSchema);

const PurchaseQualityCheckModel =
  mongoose.models.PurchaseQualityCheck ||
  mongoose.model<PurchaseQualityCheckDocument>(
    "PurchaseQualityCheck",
    PurchaseQualityCheckSchema,
  );

export default PurchaseQualityCheckModel;
