import { z } from "zod";

export const createStoreValidation = z.object({
  name: z.string().trim().min(1, "Store name is required"),
  location: z.enum(["IND", "UAE"], {
    error: "Location must be IND or UAE",
  }),
  contactNumber: z
    .string()
    .trim()
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number cannot exceed 15 digits")
    .regex(/^[+]?[0-9]+$/, "Invalid contact number"),
  inCharge: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid user ID"),
});

export const updateStoreValidation = createStoreValidation.partial();

export type CreateStoreInput = z.infer<typeof createStoreValidation>;
export type UpdateStoreInput = z.infer<typeof updateStoreValidation>;
