import mongoose, { Schema, Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface Store extends BaseDocument {
    name: string;
    location: "IND" | "UAE";
    contactNumber: string;
    inCharge: mongoose.Types.ObjectId;
}

export type StoreDocument = Store & Document;

const StoreSchema: Schema<Store> = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    location: {
        type: String,
        enum: ["IND", "UAE"],
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true,
    },
    inCharge: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

StoreSchema.add(BaseSchema);

const StoreModel =
    mongoose.models.Store ||
    mongoose.model<Store>("Store", StoreSchema);

export default StoreModel;
