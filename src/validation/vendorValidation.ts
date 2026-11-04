import { z } from "zod";

export const createVendorValidation = z.object({
    vendorName: z.string().trim().min(1, "Vendor name is required"),

    contactNo: z.string(),

    bankName: z.string(),

    accountNo: z.string(),

    ifsc: z.string(),
});

export const updateVendorValidation = createVendorValidation.partial();

export type CreateVendorInput = z.infer<typeof createVendorValidation>;
export type UpdateVendorInput = z.infer<typeof updateVendorValidation>;