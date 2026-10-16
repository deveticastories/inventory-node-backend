
import mongoose, { Schema, type Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface User extends BaseDocument {
  staffName: string;
  mobileNumber: string;
  employeeId: string;
  email: string;
  password: string;
  employeeType: "Admin" | "Biller" | "Purchaser";
}

export type UserDocument = User & Document;

const UserSchema: Schema<UserDocument> = new Schema<UserDocument>({
  staffName: {
    type: String,
    required: true,
    trim: true,
  },

  mobileNumber: {
    type: String,
    required: true,
    trim: true,
  },

  employeeId: {
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

  password: {
    type: String,
    required: true,
    select: false,
  },

  employeeType: {
    type: String,
    enum: ["Admin", "Biller", "Purchaser"],
    required: true,
  },
});

UserSchema.add(BaseSchema);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

UserSchema.index(
  { employeeId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

const UserModel = mongoose.model<UserDocument>("User", UserSchema);

export default UserModel;
