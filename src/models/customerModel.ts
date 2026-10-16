import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface Customer extends BaseDocument {
  name: string;
  contactNo: string;
  whatsAppNo: string;
  address: string;
  email: string;
}

export type CustomerDocument = Customer & Document;

const CustomerSchema: Schema<CustomerDocument> =
  new Schema<CustomerDocument>({
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactNo: {
      type: String,
      required: true,
      trim: true,
    },
    whatsAppNo: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  });

CustomerSchema.add(BaseSchema);

CustomerSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

CustomerSchema.index(
  { whatsAppNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

const CustomerModel =
  mongoose.models.Customer ||
  mongoose.model<CustomerDocument>("Customer", CustomerSchema);

export default CustomerModel;
