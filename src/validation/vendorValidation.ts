import { z } from "zod";

export const createVendorValidation = z.object({
  vendorName: z.string().trim().min(1, "Vendor name is required"),

  contactNo: z
    .string()
    .trim()
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number cannot exceed 15 digits")
    .regex(/^[+]?[0-9]+$/, "Invalid contact number"),

  bankName: z.string().trim().min(1, "Bank name is required"),

  accountNo: z.string().trim().min(1, "Account number is required"),

  ifsc: z
    .string()
    .trim()
    .min(1, "IFSC is required")
    .regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, "Invalid IFSC code")
    .transform((value) => value.toUpperCase()),
});

export const updateVendorValidation = createVendorValidation
  .partial();

export type CreateVendorInput = z.infer<typeof createVendorValidation>;
export type UpdateVendorInput = z.infer<typeof updateVendorValidation>;