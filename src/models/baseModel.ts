import mongoose, { Document, Schema } from "mongoose";

export interface BaseDocument extends Document {
  status: boolean;
  isDeleted: boolean;

  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;

  userUpdatedDate?: Date;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const BaseSchema = new Schema<BaseDocument>(
  {
    status: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    userUpdatedDate: {
      type: Date,
    },

    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);