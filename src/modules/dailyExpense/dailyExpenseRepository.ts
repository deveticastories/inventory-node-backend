
import mongoose from "mongoose";
import DailyExpenseModel from "../../models/dailyExpenseModel";
import { getPaginationMeta } from "../../utils/pagination";

export const create = async (
    expenseData: Record<string, unknown>,
) => {
    const expense = new DailyExpenseModel({
        ...expenseData,
        packingId: expenseData.packingId ?? "Open",
    });

    return expense.save();
};

export const findById = async (id: string) => {
    return DailyExpenseModel.findOne({
        _id: id,
        isDeleted: false,
    }).exec();
};

export const getAllDailyExpenses = async (
    page: number,
    limit: number,
) => {
    const filter = { isDeleted: false };
    const skip = (page - 1) * limit;

    const [expenses, totalRecords, amountResult] = await Promise.all([
        DailyExpenseModel.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),

        DailyExpenseModel.countDocuments(filter).exec(),

        DailyExpenseModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]).exec(),
    ]);

    return {
        data: expenses,
        totalAmount: amountResult[0]?.totalAmount ?? 0,
        pagination: getPaginationMeta(page, limit, totalRecords),
    };
};

export const updateById = async (
    id: string,
    updateData: Record<string, unknown>,
) => {
    return DailyExpenseModel.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        },
    ).exec();
};

export const updatePackingId = async (
    id: string,
    packingId: string,
) => {
    return DailyExpenseModel.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
            packingId: "Open",
        },
        {
            $set: { packingId },
        },
        {
            new: true,
            runValidators: true,
        },
    ).exec();
};

export const deleteDailyExpense = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    return DailyExpenseModel.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy,
            },
        },
        {
            new: true,
        },
    ).exec();
};
