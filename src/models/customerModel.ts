import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface Customer extends BaseDocument {
  name: string;
  contactNo?: string;
  whatsAppNo?: string;
  address?: string;
  email?: string;
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
      trim: true,
    },
    whatsAppNo: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  });

CustomerSchema.add(BaseSchema);

CustomerSchema.index(
  { email: 1 },
  {
    name: "email_unique_when_set",
    unique: true,
    // Optional field: only enforce uniqueness on customers that have one.
    partialFilterExpression: {
      isDeleted: false,
      email: { $type: "string" },
    },
  },
);

CustomerSchema.index(
  { whatsAppNo: 1 },
  {
    name: "whatsAppNo_unique_when_set",
    unique: true,
    // Optional field: only enforce uniqueness on customers that have one.
    partialFilterExpression: {
      isDeleted: false,
      whatsAppNo: { $type: "string" },
    },
  },
);

const CustomerModel =
  mongoose.models.Customer ||
  mongoose.model<CustomerDocument>("Customer", CustomerSchema);

export default CustomerModel;
