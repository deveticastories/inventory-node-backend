import { z } from "zod";
import { message } from "../constants/responseMessage";

/** Blank optional fields are treated as not provided. */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema.optional(),
  );

export const createCustomerValidation = z.object({
  name: z.string().trim().min(1, message.CUSTOMER_NAME_REQUIRED),
  contactNo: optional(z.string().trim()),
  whatsAppNo: optional(
    z
      .string()
      .trim()
      .regex(/^\+?[0-9]{10,15}$/, message.CUSTOMER_WHATSAPP_INVALID),
  ),
  address: optional(z.string().trim()),
  email: optional(
    z
      .string()
      .trim()
      .email(message.CUSTOMER_EMAIL_INVALID)
      .transform((value) => value.toLowerCase()),
  ),
});

export const updateCustomerValidation = createCustomerValidation.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerValidation>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerValidation>;