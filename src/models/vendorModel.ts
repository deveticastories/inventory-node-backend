import mongoose, { Schema, Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface Vendor extends BaseDocument {
    vendorName: string;
    contactNo?: string;
    bankName?: string;
    accountNo?: string;
    ifsc?: string;
}

export type VendorDocument = Vendor & Document;

const VendorSchema: Schema<Vendor> = new Schema({
    vendorName: {
        type: String,
        required: true,
        trim: true,
    },
    contactNo: {
        type: String,
        trim: true,
    },
    bankName: {
        type: String,
        trim: true,
    },
    accountNo: {
        type: String,
        trim: true,
    },
    ifsc: {
        type: String,
        trim: true,
        uppercase: true,
    },
});

VendorSchema.add(BaseSchema);

VendorSchema.index(
    { contactNo: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isDeleted: false,
            contactNo: { $type: "string" },
        },
    },
);

const VendorModel =
    mongoose.models.Vendor ||
    mongoose.model<Vendor>("Vendor", VendorSchema);

export default VendorModel;