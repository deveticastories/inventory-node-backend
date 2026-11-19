
import mongoose from "mongoose";
import {
    DailyExpenseDocument,
} from "../../models/dailyExpenseModel.js";
import * as dailyExpenseRepository from "./dailyExpenseRepository.js";
import {
    recalculatePettyCashFromMonth,
} from "../pettyCash/pettyCashService.js";

export const createDailyExpense = async (
    expenseData: Partial<DailyExpenseDocument>,
    createdBy: mongoose.Types.ObjectId,
): Promise<DailyExpenseDocument> => {
    try {
        const expense = await dailyExpenseRepository.create({
            ...expenseData,
            createdBy,
            updatedBy: createdBy,
        });

        const expenseDate = expense.createdAt ?? new Date();

        await recalculatePettyCashFromMonth(
            expenseDate.getMonth() + 1,
            expenseDate.getFullYear(),
        );

        return expense;
    } catch (error: any) {
        throw new Error(
            error?.message || "Failed to create daily expense",
        );
    }
};

export const updateDailyExpense = async (
    id: string,
    expenseData: Partial<DailyExpenseDocument>,
    updatedBy: mongoose.Types.ObjectId,
): Promise<DailyExpenseDocument> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Invalid daily expense ID");
        }

        const existingExpense =
            await dailyExpenseRepository.findById(id);

        if (!existingExpense) {
            throw new Error("Daily expense not found");
        }

        const expense = await dailyExpenseRepository.updateById(
            id,
            {
                ...expenseData,
                updatedBy,
            },
        );

        if (!expense) {
            throw new Error("Daily expense not found");
        }

        const expenseDate = existingExpense.createdAt ?? new Date();

        await recalculatePettyCashFromMonth(
            expenseDate.getMonth() + 1,
            expenseDate.getFullYear(),
        );

        return expense;
    } catch (error: any) {
        throw new Error(
            error?.message || "Failed to update daily expense",
        );
    }
};

export const getDailyExpenseById = async (
    id: string,
): Promise<DailyExpenseDocument | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid daily expense ID");
    }

    return dailyExpenseRepository.findById(id);
};

export const getAllDailyExpenses = async (
    page: number,
    limit: number,
) => {
    return dailyExpenseRepository.getAllDailyExpenses(page, limit);
};

export const deleteDailyExpense = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
): Promise<DailyExpenseDocument> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Invalid daily expense ID");
        }

        const existingExpense =
            await dailyExpenseRepository.findById(id);

        if (!existingExpense) {
            throw new Error("Daily expense not found");
        }

        const expense = await dailyExpenseRepository.deleteDailyExpense(
            id,
            deletedBy,
        );

        if (!expense) {
            throw new Error("Daily expense not found");
        }

        const expenseDate = existingExpense.createdAt ?? new Date();

        await recalculatePettyCashFromMonth(
            expenseDate.getMonth() + 1,
            expenseDate.getFullYear(),
        );

        return expense;
    } catch (error: any) {
        throw new Error(
            error?.message || "Failed to delete daily expense",
        );
    }
};
