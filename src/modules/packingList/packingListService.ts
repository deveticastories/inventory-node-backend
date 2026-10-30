import mongoose from "mongoose";
import * as packingListRepo from "./packingListRepository";
import PackingListModel, {
    type PackingListStatus,
} from "../../models/packingListModel";
import DailyExpenseModel from "../../models/dailyExpenseModel";
import VendorModel from "../../models/vendorModel";
import UAEMainStockModel from "../../models/uaeMainStockModel";
import { getSettings } from "../settings/settingsService";
import {
    allocateFromMainStock,
    getAvailableForPacking,
    getMainStockLines,
} from "../stock/stockService";
import { round2 } from "../../utils/errorStatus";

import logger from "../../utils/logger";

const MAX_PACKING_ID_RETRIES = 3;

interface PackingStyleInput {
    styleNo: string;
    productName: string;
    vendor: string;
    qty: number;
}

interface CreatePackingListInput {
    packingDate?: string | Date;
    salary?: number;
    dailyExpenses?: string[];
    styles: PackingStyleInput[];
}

const isDuplicatePackingIdError = (error: unknown): boolean => {
    const err = error as {
        code?: number;
        keyPattern?: Record<string, unknown>;
    };
    return err?.code === 11000 && Boolean(err.keyPattern?.packingId);
};

const parseSalary = (salary: unknown) => {
    const value = salary === undefined || salary === "" ? 0 : Number(salary);

    if (!Number.isFinite(value) || value < 0) {
        throw new Error("PACKING_SALARY_INVALID");
    }

    return value;
};

const parseDate = (date: unknown) => {
    const value = date ? new Date(date as string) : new Date();

    if (Number.isNaN(value.getTime())) {
        throw new Error("PACKING_DATE_INVALID");
    }

    return value;
};

const isStyleNoUsed = async (styleNos: string[], excludeId?: string) => {
    const filter: Record<string, unknown> = {
        isDeleted: false,
        "styles.styleNo": { $in: styleNos },
    };

    if (excludeId) {
        filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    const [packingList, uaeStock] = await Promise.all([
        PackingListModel.exists(filter),
        UAEMainStockModel.exists({
            isDeleted: false,
            styleNo: { $in: styleNos },
        }),
    ]);

    return Boolean(packingList || uaeStock);
};

/** Validates the styles and allocates their qty from TRP_MAIN STORE (FIFO). */
const buildStyles = async (styles: unknown, excludePackingListId?: string) => {
    if (!Array.isArray(styles) || styles.length === 0) {
        throw new Error("PACKING_STYLES_REQUIRED");
    }

    const styleNos = new Set<string>();

    for (const style of styles as PackingStyleInput[]) {
        if (
            typeof style?.styleNo !== "string" ||
            !style.styleNo.trim() ||
            typeof style.productName !== "string" ||
            !style.productName.trim() ||
            !mongoose.isValidObjectId(style.vendor) ||
            !Number.isInteger(style.qty) ||
            style.qty <= 0
        ) {
            throw new Error("PACKING_STYLE_INVALID");
        }

        const styleNo = style.styleNo.trim();

        if (styleNos.has(styleNo)) {
            throw new Error("DUPLICATE_PACKING_STYLE_NO");
        }

        styleNos.add(styleNo);
    }

    if (await isStyleNoUsed([...styleNos], excludePackingListId)) {
        throw new Error("PACKING_STYLE_NO_ALREADY_USED");
    }

    const vendorIds = [
        ...new Set((styles as PackingStyleInput[]).map((s) => String(s.vendor))),
    ];
    const vendorCount = await VendorModel.countDocuments({
        _id: { $in: vendorIds },
        isDeleted: false,
    });

    if (vendorCount !== vendorIds.length) {
        throw new Error("PACKING_VENDOR_NOT_FOUND");
    }

    const lines = await getMainStockLines({ excludePackingListId });
    const reserved = new Map<string, number>();

    return (styles as PackingStyleInput[]).map((style) => {
        const productName = style.productName.trim();
        const vendor = String(style.vendor);
        const allocations = allocateFromMainStock(
            lines,
            productName,
            vendor,
            style.qty,
            reserved,
        );
        const cost = allocations.reduce(
            (total, allocation) => total + allocation.qty * allocation.rate,
            0,
        );

        return {
            styleNo: style.styleNo.trim(),
            productName,
            vendor: new mongoose.Types.ObjectId(vendor),
            qty: style.qty,
            rate: round2(cost / style.qty),
            allocations,
            moved: false,
        };
    });
};

/** Only expenses that are still "Open" can be attached to a packing list. */
const getAttachableExpenses = async (
    expenseIds: unknown,
    packingId?: string,
) => {
    if (expenseIds === undefined) return [];

    if (
        !Array.isArray(expenseIds) ||
        expenseIds.some((id) => !mongoose.isValidObjectId(id))
    ) {
        throw new Error("DAILY_EXPENSE_ID_INVALID");
    }

    const ids = [...new Set(expenseIds.map(String))];

    const expenses = await DailyExpenseModel.find({
        _id: { $in: ids },
        isDeleted: false,
    }).select("amount packingId");

    if (expenses.length !== ids.length) {
        throw new Error("DAILY_EXPENSE_NOT_FOUND");
    }

    if (
        expenses.some(
            (expense) =>
                expense.packingId !== "Open" && expense.packingId !== packingId,
        )
    ) {
        throw new Error("DAILY_EXPENSE_ALREADY_ASSIGNED");
    }

    return expenses;
};

const sumExpenses = (expenses: { amount: number }[]) =>
    expenses.reduce((total, expense) => total + expense.amount, 0);

export const createPackingList = async (
    packingListData: CreatePackingListInput,
    createdBy: mongoose.Types.ObjectId,
) => {
    try {
        logger.info("Creating packing list");

        const packingDate = parseDate(packingListData.packingDate);
        const salary = parseSalary(packingListData.salary);
        const styles = await buildStyles(packingListData.styles);
        const expenses = await getAttachableExpenses(
            packingListData.dailyExpenses,
        );

        for (let attempt = 1; attempt <= MAX_PACKING_ID_RETRIES; attempt++) {
            const packingId = await packingListRepo.generatePackingId();

            try {
                const packingList = await packingListRepo.create({
                    packingDate,
                    salary,
                    styles,
                    dailyExpenses: expenses.map((expense) => expense._id),
                    totalQty: styles.reduce((total, style) => total + style.qty, 0),
                    totalExpense: sumExpenses(expenses),
                    packingListStatus: "In Transit queue",
                    packingId,
                    createdBy,
                });

                // Mark the attached daily expenses as used by this packing list
                if (expenses.length) {
                    await DailyExpenseModel.updateMany(
                        {
                            _id: { $in: expenses.map((expense) => expense._id) },
                            packingId: "Open",
                        },
                        { $set: { packingId, updatedBy: createdBy } },
                    );
                }

                logger.info(`Packing list created successfully: ${packingId}`);

                return packingList;
            } catch (error) {
                if (
                    isDuplicatePackingIdError(error) &&
                    attempt < MAX_PACKING_ID_RETRIES
                ) {
                    logger.warn(
                        `Packing ID ${packingId} already taken, retrying (${attempt}/${MAX_PACKING_ID_RETRIES})`,
                    );
                    continue;
                }

                throw error;
            }
        }

        throw new Error("PACKING_ID_GENERATION_FAILED");
    } catch (error) {
        logger.error("Failed to create packing list", error);
        throw error;
    }
};

export const getAllPackingLists = async (
    page: number,
    limit: number,
    status?: PackingListStatus,
) => {
    try {
        logger.info(
            `Fetching packing lists: page=${page}, limit=${limit}, status=${status ?? "all"}`,
        );

        const result = await packingListRepo.getAllPackingLists(
            page,
            limit,
            status,
        );

        logger.info("Packing lists fetched successfully");

        return result;
    } catch (error) {
        logger.error("Failed to fetch packing lists", error);
        throw error;
    }
};

export const getPackingListById = async (id: string) => {
    try {
        if (!mongoose.isValidObjectId(id)) {
            logger.warn(`Invalid packing list ID: ${id}`);
            throw new Error("PACKING_LIST_ID_INVALID");
        }

        const packingList = await packingListRepo.findById(id);

        if (!packingList) {
            logger.warn(`Packing list not found: ${id}`);
            return null;
        }

        logger.info(
            `Packing list fetched successfully: ${packingList.packingId ?? id}`,
        );

        return packingList;
    } catch (error) {
        logger.error(`Failed to fetch packing list: ${id}`, error);
        throw error;
    }
};

/** Product / vendor / qty lookups used while adding styles. */
export const getAvailableStock = async (
    productName?: string,
    vendor?: string,
) => {
    if (vendor && !mongoose.isValidObjectId(vendor)) {
        throw new Error("PACKING_VENDOR_ID_INVALID");
    }

    if (vendor && !productName) {
        throw new Error("PACKING_PRODUCT_NAME_REQUIRED");
    }

    return getAvailableForPacking(productName, vendor);
};

/**
 * Editing is only allowed while no style has been transferred to UAE.
 * Styles, salary, date and attached expenses can all change; stock is
 * re-allocated and expenses are re-attached.
 */
export const editPackingList = async (
    id: string,
    updateData: Partial<CreatePackingListInput>,
    updatedBy: mongoose.Types.ObjectId,
) => {
    try {
        if (!mongoose.isValidObjectId(id)) {
            logger.warn(`Invalid packing list ID for update: ${id}`);
            throw new Error("PACKING_LIST_ID_INVALID");
        }

        const existing = await PackingListModel.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!existing) {
            logger.warn(`Packing list not found for update: ${id}`);
            return null;
        }

        if (existing.styles.some((style: { moved: boolean }) => style.moved)) {
            throw new Error("PACKING_LIST_ALREADY_TRANSFERRED");
        }

        const updates: Record<string, unknown> = {
            updatedBy,
            userUpdatedDate: new Date(),
        };

        if (updateData.packingDate !== undefined) {
            updates.packingDate = parseDate(updateData.packingDate);
        }

        if (updateData.salary !== undefined) {
            updates.salary = parseSalary(updateData.salary);
        }

        if (updateData.styles !== undefined) {
            const styles = await buildStyles(updateData.styles, id);

            updates.styles = styles;
            updates.totalQty = styles.reduce((total, style) => total + style.qty, 0);
        }

        let expenses: Awaited<ReturnType<typeof getAttachableExpenses>> | null =
            null;

        if (updateData.dailyExpenses !== undefined) {
            expenses = await getAttachableExpenses(
                updateData.dailyExpenses,
                existing.packingId,
            );

            updates.dailyExpenses = expenses.map((expense) => expense._id);
            updates.totalExpense = sumExpenses(expenses);
        }

        const updatedPackingList = await packingListRepo.updateById(id, updates);

        if (expenses && existing.packingId) {
            const ids = expenses.map((expense) => expense._id);

            await DailyExpenseModel.updateMany(
                { packingId: existing.packingId, _id: { $nin: ids } },
                { $set: { packingId: "Open", updatedBy } },
            );
            await DailyExpenseModel.updateMany(
                { _id: { $in: ids } },
                { $set: { packingId: existing.packingId, updatedBy } },
            );
        }

        logger.info(
            `Packing list updated successfully: ${existing.packingId ?? id}`,
        );

        return updatedPackingList;
    } catch (error) {
        logger.error(`Failed to update packing list: ${id}`, error);
        throw error;
    }
};

export const deletePackingList = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    try {
        if (!mongoose.isValidObjectId(id)) {
            logger.warn(`Invalid packing list ID for deletion: ${id}`);
            throw new Error("PACKING_LIST_ID_INVALID");
        }

        const existing = await PackingListModel.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!existing) {
            logger.warn(`Packing list not found for deletion: ${id}`);
            return null;
        }

        if (existing.styles.some((style: { moved: boolean }) => style.moved)) {
            throw new Error("PACKING_LIST_ALREADY_TRANSFERRED");
        }

        // Soft-deleting releases the packed stock back to TRP_MAIN STORE
        const deletedPackingList = await packingListRepo.deletePackingList(
            id,
            deletedBy,
        );

        if (existing.packingId) {
            await DailyExpenseModel.updateMany(
                { packingId: existing.packingId },
                { $set: { packingId: "Open", updatedBy: deletedBy } },
            );
        }

        logger.info(
            `Packing list deleted successfully: ${existing.packingId ?? id}`,
        );

        return deletedPackingList;
    } catch (error) {
        logger.error(`Failed to delete packing list: ${id}`, error);
        throw error;
    }
};

/**
 * Transit calculation for one packing list:
 *   additional expenses = salary + attached daily expenses
 *   expense rec / style = additional / exchange rate / number of styles
 *   per pc AED          = unit rate INR / exchange rate
 *   updated unit rate   = per pc AED + expense rec
 *   selling price       = updated unit rate + profit %
 */
export const getTransitDetails = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PACKING_LIST_ID_INVALID");
    }

    const packingList = await PackingListModel.findOne({
        _id: id,
        isDeleted: false,
    }).lean<any>();

    if (!packingList) {
        throw new Error("PACKING_LIST_NOT_FOUND");
    }

    const [settings, expenses] = await Promise.all([
        getSettings(),
        DailyExpenseModel.find({
            _id: { $in: packingList.dailyExpenses ?? [] },
            isDeleted: false,
        })
            .select("amount")
            .lean(),
    ]);

    const exchangeRate = settings?.exchangeRate || 1;
    const profitPercent = settings?.profitPercent ?? 0;
    const additionalExpenses =
        Number(packingList.salary ?? 0) +
        expenses.reduce((total: number, e: any) => total + e.amount, 0);
    const styleCount = packingList.styles.length || 1;
    const expenseRecAED = additionalExpenses / exchangeRate / styleCount;

    const styles = packingList.styles.map((style: any) => {
        const perPcAED = Number(style.rate ?? 0) / exchangeRate;
        const updatedUnitRateAED = perPcAED + expenseRecAED;

        return {
            _id: style._id,
            styleNo: style.styleNo,
            productName: style.productName,
            vendor: style.vendor,
            qty: style.qty,
            unitRateINR: style.rate,
            perPcAED: round2(perPcAED),
            expenseRecAED: round2(expenseRecAED),
            updatedUnitRateAED: round2(updatedUnitRateAED),
            sellingPriceAED: round2(
                updatedUnitRateAED * (1 + profitPercent / 100),
            ),
            moved: Boolean(style.moved),
            transferDate: style.transferDate,
            status: style.moved ? "In UAE store" : "Pending",
        };
    });

    return {
        packingList: {
            _id: packingList._id,
            packingId: packingList.packingId,
            packingDate: packingList.packingDate,
            packingListStatus: packingList.packingListStatus,
        },
        exchangeRate,
        profitPercent,
        additionalExpenses: round2(additionalExpenses),
        expenseRecommendationAED: round2(expenseRecAED),
        styles,
    };
};

/**
 * Moves the selected styles to UAE_MAIN STORE using the current rates.
 * The packing list becomes "Completed" once every style is moved.
 */
export const transferStylesToUAE = async (
    id: string,
    styleIds: unknown,
    updatedBy: mongoose.Types.ObjectId,
) => {
    if (!Array.isArray(styleIds) || styleIds.length === 0) {
        throw new Error("PACKING_STYLE_IDS_REQUIRED");
    }

    if (styleIds.some((styleId) => !mongoose.isValidObjectId(styleId))) {
        throw new Error("PACKING_STYLE_ID_INVALID");
    }

    if (new Set(styleIds.map(String)).size !== styleIds.length) {
        throw new Error("DUPLICATE_PACKING_STYLE_ID");
    }

    const transit = await getTransitDetails(id);
    const selected = styleIds.map((styleId) => {
        const style = transit.styles.find(
            (row: { _id: mongoose.Types.ObjectId }) =>
                row._id.toString() === String(styleId),
        );

        if (!style) {
            throw new Error("PACKING_STYLE_NOT_FOUND");
        }

        if (style.moved) {
            throw new Error("PACKING_STYLE_ALREADY_TRANSFERRED");
        }

        return style;
    });

    const transferDate = new Date();
    const packingList = await PackingListModel.findById(id);

    if (!packingList) {
        throw new Error("PACKING_LIST_NOT_FOUND");
    }

    for (const row of selected) {
        const style = packingList.styles.id(row._id);

        if (!style) continue;

        style.moved = true;
        style.transferDate = transferDate;
        style.transit = {
            perPcAED: row.perPcAED,
            expenseRecAED: row.expenseRecAED,
            updatedUnitRateAED: row.updatedUnitRateAED,
        };
        style.sellingPriceAED = row.sellingPriceAED;
    }

    packingList.packingListStatus = packingList.styles.every(
        (style: { moved: boolean }) => style.moved,
    )
        ? "Completed"
        : "In Transit queue";
    packingList.updatedBy = updatedBy;
    packingList.userUpdatedDate = transferDate;

    await packingList.save();

    await UAEMainStockModel.insertMany(
        selected.map((row) => ({
            styleNo: row.styleNo,
            productName: row.productName,
            qty: row.qty,
            costAED: row.updatedUnitRateAED,
            sellingPriceAED: row.sellingPriceAED,
            transitDate: transferDate,
            packingList: packingList._id,
            packingStyle: row._id,
            createdBy: updatedBy,
        })),
    );

    logger.info(
        `${selected.length} style(s) of ${packingList.packingId} moved to UAE_MAIN STORE`,
    );

    return getTransitDetails(id);
};

export const updatePackingListsStatus = async (
    packingListIds: string[],
    packingListStatus: PackingListStatus,
    updatedBy: mongoose.Types.ObjectId,
) => {
    try {
        if (
            !Array.isArray(packingListIds) ||
            packingListIds.length === 0
        ) {
            throw new Error("PACKING_LIST_IDS_REQUIRED");
        }

        if (
            packingListIds.some(
                (id) =>
                    typeof id !== "string" ||
                    !mongoose.isValidObjectId(id),
            )
        ) {
            throw new Error("PACKING_LIST_ID_INVALID");
        }

        if (new Set(packingListIds).size !== packingListIds.length) {
            throw new Error("DUPLICATE_PACKING_LIST_IDS");
        }

        const validStatuses: PackingListStatus[] = [
            "Pending",
            "In Transit queue",
            "Completed",
        ];

        if (!validStatuses.includes(packingListStatus)) {
            throw new Error("PACKING_LIST_STATUS_INVALID");
        }

        const result = await packingListRepo.updatePackingListsStatus(
            packingListIds,
            packingListStatus,
            updatedBy,
        );

        if (result.matchedCount !== packingListIds.length) {
            throw new Error("PACKING_LISTS_NOT_FOUND");
        }

        logger.info(
            `Packing list status updated for ${result.modifiedCount} packing lists`,
        );

        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            packingListStatus,
        };
    } catch (error) {
        logger.error("Failed to update packing list statuses", error);
        throw error;
    }
};
