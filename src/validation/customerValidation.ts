import { z } from "zod";
import { message } from "../constants/responseMessage";

export const createCustomerValidation = z.object({
  name: z.string().trim().min(1, message.CUSTOMER_NAME_REQUIRED),
  contactNo: z.string().trim().min(1, message.CUSTOMER_CONTACT_NO_REQUIRED),
  whatsAppNo: z
    .string()
    .trim()
    .min(1, message.CUSTOMER_WHATSAPP_REQUIRED)
    .regex(/^\+?[0-9]{10,15}$/, message.CUSTOMER_WHATSAPP_INVALID),
  address: z.string().trim().min(1, message.CUSTOMER_ADDRESS_REQUIRED),
  email: z
    .string()
    .trim()
    .min(1, message.CUSTOMER_EMAIL_REQUIRED)
    .email(message.CUSTOMER_EMAIL_INVALID)
    .transform((value) => value.toLowerCase()),
});

export const updateCustomerValidation = createCustomerValidation.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerValidation>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerValidation>;