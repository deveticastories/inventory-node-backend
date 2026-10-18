
import mongoose from "mongoose";
import * as dailyExpenseRepo from "./dailyExpenseRepository";
import { CreateDailyExpenseInput, UpdateDailyExpensePackingInput } from "../../validation/dailyExpenseValidation";

export const createDailyExpense = async (
    expenseData: CreateDailyExpenseInput,
    createdBy: mongoose.Types.ObjectId,
) => {
    return dailyExpenseRepo.create({
        ...expenseData,
        packingId: "Open",
        createdBy,
    });
};

export const getAllDailyExpenses = async (
    page: number,
    limit: number,
) => {
    return dailyExpenseRepo.getAllDailyExpenses(page, limit);
};

export const getDailyExpenseById = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("DAILY_EXPENSE_ID_INVALID");
    }

    return dailyExpenseRepo.findById(id);
};

export const updateDailyExpensePacking = async (
    id: string,
    packingData: UpdateDailyExpensePackingInput,
    updatedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("DAILY_EXPENSE_ID_INVALID");
    }

    const expense = await dailyExpenseRepo.findById(id);

    if (!expense) {
        return null;
    }

    if (expense.packingId !== "Open") {
        throw new Error("DAILY_EXPENSE_ALREADY_ASSIGNED");
    }

    const updatedExpense = await dailyExpenseRepo.updatePackingId(
        id,
        packingData.packingId,
    );

    if (!updatedExpense) {
        throw new Error("DAILY_EXPENSE_ALREADY_ASSIGNED");
    }

    return dailyExpenseRepo.updateById(id, {
        updatedBy,
        userUpdatedDate: new Date(),
    });
};

export const deleteDailyExpense = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("DAILY_EXPENSE_ID_INVALID");
    }

    return dailyExpenseRepo.deleteDailyExpense(id, deletedBy);
};
