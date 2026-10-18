
import { z } from "zod";
import { message } from "../constants/responseMessage";

export const createDailyExpenseValidation = z.object({
    date: z.coerce.date({
        message: message.INVALID_EXPENSE_DATE,
    }),
    expenseType: z
        .string()
        .trim()
        .min(1, message.EXPENSE_TYPE_REQUIRED),
    paymentType: z.enum(["Cash", "Upi", "Account"], {
        message: message.INVALID_PAYMENT_TYPE,
    }),
    amount: z
        .number()
        .positive(message.INVALID_EXPENSE_AMOUNT)
        .finite(message.INVALID_EXPENSE_AMOUNT),
    description: z
        .string()
        .trim()
        .optional()
        .default(""),
});

export const updateDailyExpensePackingValidation = z.object({
    packingId: z
        .string()
        .trim()
        .min(1, message.PACKING_ID_REQUIRED)
        .refine((value) => value.toLowerCase() !== "open", {
            message: message.PACKING_ID_REQUIRED,
        }),
});

export type CreateDailyExpenseInput = z.infer<
    typeof createDailyExpenseValidation
>;

export type UpdateDailyExpensePackingInput = z.infer<
    typeof updateDailyExpensePackingValidation
>;
