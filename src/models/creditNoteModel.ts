import mongoose, { Schema, Document } from "mongoose";
import { BaseDocument, BaseSchema } from "./baseModel";

export interface CreditNote extends BaseDocument {
  amount: number;
  description?: string;
}

export type CreditNoteDocument = CreditNote & Document;

const CreditNoteSchema: Schema<CreditNote> = new Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
});

CreditNoteSchema.add(BaseSchema);

export default mongoose.model<CreditNoteDocument>(
  "CreditNote",
  CreditNoteSchema,
);