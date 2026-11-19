
import mongoose from "mongoose";
import PettyCash from "../../models/pettyCashModel.js";
import CreditNote from "../../models/creditNoteModel.js";
import DailyExpense from "../../models/dailyExpenseModel.js";

export const updatePettyCashBalance = async (
    month: number,
    year: number,
) => {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error("Invalid month");
    }

    if (!Number.isInteger(year)) {
        throw new Error("Invalid year");
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const previousMonthDate = new Date(year, month - 2, 1);
    const previousMonth = previousMonthDate.getMonth() + 1;
    const previousYear = previousMonthDate.getFullYear();

    const previousPettyCash = await PettyCash.findOne({
        month: previousMonth,
        year: previousYear,
        isDeleted: false,
    });

    const openingBalance =
        previousPettyCash?.balanceAfterExpenses ?? 0;

    const [creditNoteResult, dailyExpenseResult] = await Promise.all([
        CreditNote.aggregate([
            {
                $match: {
                    isDeleted: false,
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$amount",
                    },
                },
            },
        ]),

        DailyExpense.aggregate([
            {
                $match: {
                    isDeleted: false,
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$amount",
                    },
                },
            },
        ]),
    ]);

    const totalCreditNotes = creditNoteResult[0]?.total ?? 0;
    const totalDailyExpenses = dailyExpenseResult[0]?.total ?? 0;
    console.log(totalDailyExpenses,'totalDailyExpenses')

    const pettyCashBalance =
        openingBalance + totalCreditNotes;

    const balanceAfterExpenses =
        pettyCashBalance - totalDailyExpenses;

    let pettyCash = await PettyCash.findOne({
        month,
        year,
        isDeleted: false,
    });

    if (!pettyCash) {
        pettyCash = new PettyCash({
            month,
            year,
            openingBalance,
            totalFundsAdded: totalCreditNotes,
            totalExpenses: totalDailyExpenses,
            pettyCashBalance,
            balanceAfterExpenses,
        });
    } else {
        pettyCash.openingBalance = openingBalance;
        pettyCash.totalFundsAdded = totalCreditNotes;
        pettyCash.totalExpenses = totalDailyExpenses;
        pettyCash.pettyCashBalance = pettyCashBalance;
        pettyCash.balanceAfterExpenses = balanceAfterExpenses;
    }

    await pettyCash.save();

    return pettyCash;
};
export const createOpeningPettyCash = async (
    openingBalance: number,
    createdBy?: mongoose.Types.ObjectId,
) => {
    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
        throw new Error("Opening balance must be a non-negative number");
    }

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    let pettyCash = await PettyCash.findOne({
        month,
        year,
        isDeleted: false,
    });

    if (!pettyCash) {
        pettyCash = new PettyCash({
            month,
            year,
            openingBalance,
            pettyCashBalance: openingBalance,
            balanceAfterExpenses: openingBalance,
            totalFundsAdded: 0,
            totalExpenses: 0,
            ...(createdBy && {
                createdBy,
                updatedBy: createdBy,
            }),
        });
    } else if (createdBy) {
        pettyCash.updatedBy = createdBy;
    }

    await pettyCash.save();

    return updatePettyCashBalance(month, year);
};
export const getPettyCashBalance = async () => {
    const currentDate = new Date();

    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    return updatePettyCashBalance(month, year);
};
export const recalculatePettyCashFromMonth = async (
    month: number,
    year: number,
) => {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error("Invalid month");
    }

    if (!Number.isInteger(year)) {
        throw new Error("Invalid year");
    }

    const latestPettyCash = await PettyCash.findOne({
        isDeleted: false,
    }).sort({ year: -1, month: -1 });

    const currentDate = new Date();

    const endYear = Math.max(
        latestPettyCash?.year ?? year,
        currentDate.getFullYear(),
    );

    const endMonth =
        endYear === currentDate.getFullYear()
            ? currentDate.getMonth() + 1
            : latestPettyCash?.month ?? month;

    let currentMonth = month;
    let currentYear = year;

    while (
        currentYear < endYear ||
        (currentYear === endYear && currentMonth <= endMonth)
    ) {
        await updatePettyCashBalance(currentMonth, currentYear);

        currentMonth++;

        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
    }
};