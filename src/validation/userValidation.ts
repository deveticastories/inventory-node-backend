
import { z } from "zod";
import { message } from "../constants/responseMessage";

export const createUserValidation = z.object({
  staffName: z
    .string()
    .trim()
    .min(1, message.STAFF_NAME_REQUIRED),

  mobileNumber: z
    .string()
    .trim()
    .min(10, message.MOBILE_NUMBER_MIN)
    .max(15, message.MOBILE_NUMBER_MAX)
    .regex(/^[+]?[0-9]+$/, message.MOBILE_NUMBER_INVALID),

  employeeId: z
    .string()
    .trim()
    .min(1, message.EMPLOYEE_ID_REQUIRED),

  email: z
    .string()
    .trim()
    .min(1, message.EMAIL_REQUIRED)
    .email(message.EMAIL_INVALID)
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(6, message.PASSWORD_MIN),

  employeeType: z.enum(["Admin", "Biller", "Purchaser"], {
    error: message.EMPLOYEE_TYPE_INVALID,
  }),
});

export const updateUserValidation = z.object({
  staffName: z
    .string()
    .trim()
    .min(1, message.STAFF_NAME_REQUIRED)
    .optional(),

  mobileNumber: z
    .string()
    .trim()
    .min(10, message.MOBILE_NUMBER_MIN)
    .max(15, message.MOBILE_NUMBER_MAX)
    .regex(/^[+]?[0-9]+$/, message.MOBILE_NUMBER_INVALID)
    .optional(),

  employeeId: z
    .string()
    .trim()
    .min(1, message.EMPLOYEE_ID_REQUIRED)
    .optional(),

  email: z
    .string()
    .trim()
    .min(1, message.EMAIL_REQUIRED)
    .email(message.EMAIL_INVALID)
    .transform((value) => value.toLowerCase())
    .optional(),

  password: z
    .string()
    .min(6, message.PASSWORD_MIN)
    .optional(),

  employeeType: z
    .enum(["Admin", "Biller", "Purchaser"], {
      error: message.EMPLOYEE_TYPE_INVALID,
    })
    .optional(),
});
export const updateUserStatusValidation = z.object({
  status: z.boolean({
    error: message.STATUS_MUST_BE_BOOLEAN,
  }),
});
export type CreateUserInput = z.infer<typeof createUserValidation>;
export type UpdateUserInput = z.infer<typeof updateUserValidation>;
export type UpdateUserStatusInput = z.infer<
  typeof updateUserStatusValidation
>;