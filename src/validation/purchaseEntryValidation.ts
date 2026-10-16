
import mongoose from "mongoose";
import { z } from "zod";
import { message } from "../constants/responseMessage";

const purchaseProductValidation = z.object({
  productName: z.string().trim().min(1, message.PURCHASE_PRODUCT_NAME_REQUIRED),
  purchaseQty: z.number().int().positive(message.PURCHASE_QTY_INVALID),
  purchaseRate: z.number().min(0, message.PURCHASE_RATE_INVALID),
});

export const createPurchaseEntryValidation = z.object({
  purchaseDate: z.coerce.date(),
  vendor: z.string().refine(
    (value) => mongoose.isValidObjectId(value),
    message.PURCHASE_VENDOR_INVALID,
  ),
  products: z.array(purchaseProductValidation).min(
    1,
    message.PURCHASE_PRODUCTS_REQUIRED,
  ),
  totalIncludingGST: z.number().min(0, message.PURCHASE_GST_TOTAL_INVALID),
});

export const updatePurchaseEntryValidation = z.object({
  purchaseDate: z.coerce.date().optional(),
  vendor: z.string().refine(
    (value) => mongoose.isValidObjectId(value),
    message.PURCHASE_VENDOR_INVALID,
  ).optional(),
  products: z.array(purchaseProductValidation).min(
    1,
    message.PURCHASE_PRODUCTS_REQUIRED,
  ).optional(),
  totalIncludingGST: z.number().min(0, message.PURCHASE_GST_TOTAL_INVALID).optional(),
  qcStatus: z.enum(["Pending", "Done"]).optional(),
});

export const updatePurchaseEntryQCValidation = z.object({
  qcStatus: z.enum(["Pending", "Done"]),
});

export type CreatePurchaseEntryInput = z.infer<
  typeof createPurchaseEntryValidation
>;

export type UpdatePurchaseEntryInput = z.infer<
  typeof updatePurchaseEntryValidation
>;
