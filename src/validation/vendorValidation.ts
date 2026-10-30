import { z } from "zod";

export const createVendorValidation = z.object({
  vendorName: z.string().trim().min(1, "Vendor name is required"),

  contactNo: z
    .string()
    .trim()
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number cannot exceed 15 digits")
    .regex(/^[+]?[0-9]+$/, "Invalid contact number"),

  bankName: z.string().trim().optional().default(""),

  accountNo: z.string().trim().optional().default(""),

  ifsc: z
    .string()
    .trim()
    .regex(/^([A-Za-z]{4}0[A-Za-z0-9]{6})?$/, "Invalid IFSC code")
    .transform((value) => value.toUpperCase())
    .optional()
    .default(""),
});

export const updateVendorValidation = createVendorValidation
  .partial();

export type CreateVendorInput = z.infer<typeof createVendorValidation>;
export type UpdateVendorInput = z.infer<typeof updateVendorValidation>;