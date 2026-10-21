import mongoose from "mongoose";
import * as packingListRepo from "./packingListRepository";
import type { PackingListStatus } from "../../models/packingListModel";
import DailyExpenseModel from "../../models/dailyExpenseModel";

import logger from "../../utils/logger";

const MAX_PACKING_ID_RETRIES = 3;
interface PackingStyleTransitUpdate {
    styleId: string;
    transit: {
        perPcAED: number;
        expenseRecAED: number;
        updatedUnitRateAED: number;
    };
}

const isDuplicatePackingIdError = (error: unknown): boolean => {
    const err = error as {
        code?: number;
        keyPattern?: Record<string, unknown>;
    };
    return err?.code === 11000 && Boolean(err.keyPattern?.packingId);
};

const calculateTotalQty = (styles: unknown): number | undefined => {
    if (!Array.isArray(styles)) return undefined;

    return styles.reduce(
        (sum: number, style: { qty?: number }) => sum + (Number(style?.qty) || 0),
        0,
    );
};

export const createPackingList = async (
    packingListData: Record<string, unknown>,
    createdBy: mongoose.Types.ObjectId,
) => {
    try {
        logger.info("Creating packing list");

        const { packingId: _ignored, ...data } = packingListData;

        const totalQty = calculateTotalQty(data.styles);

        const dailyExpenseIds = Array.isArray(data.dailyExpenses)
            ? data.dailyExpenses.map((id) => new mongoose.Types.ObjectId(String(id)))
            : [];

        const expenses = dailyExpenseIds.length
            ? await DailyExpenseModel.find({
                _id: { $in: dailyExpenseIds },
                isDeleted: false,
            }).select("amount")
            : [];

        const totalExpense = expenses.reduce(
            (total, expense) => total + expense.amount,
            0,
        );

        for (let attempt = 1; attempt <= MAX_PACKING_ID_RETRIES; attempt++) {
            const packingId = await packingListRepo.generatePackingId();

            try {
                const packingList = await packingListRepo.create({
                    ...data,
                    ...(totalQty !== undefined && { totalQty }),
                    totalExpense,
                    packingId,
                    createdBy,
                });

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

export const editPackingList = async (
    id: string,
    updateData: Record<string, unknown>,
    updatedBy: mongoose.Types.ObjectId,
) => {
    try {
        if (!mongoose.isValidObjectId(id)) {
            logger.warn(`Invalid packing list ID for update: ${id}`);
            throw new Error("PACKING_LIST_ID_INVALID");
        }

        // packingId is auto-generated and must never be changed by the client
        const { packingId: _packingId, ...editableData } = updateData;

        const totalQty = calculateTotalQty(editableData.styles);

        const updatedPackingList = await packingListRepo.updateById(id, {
            ...editableData,
            ...(totalQty !== undefined && { totalQty }),
            updatedBy,
            userUpdatedDate: new Date(),
        });

        if (!updatedPackingList) {
            logger.warn(`Packing list not found for update: ${id}`);
            return null;
        }

        logger.info(
            `Packing list updated successfully: ${updatedPackingList.packingId ?? id}`,
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

        const deletedPackingList = await packingListRepo.deletePackingList(
            id,
            deletedBy,
        );

        if (!deletedPackingList) {
            logger.warn(`Packing list not found for deletion: ${id}`);
            return null;
        }

        logger.info(
            `Packing list deleted successfully: ${deletedPackingList.packingId ?? id}`,
        );

        return deletedPackingList;
    } catch (error) {
        logger.error(`Failed to delete packing list: ${id}`, error);
        throw error;
    }
};
export const convertPackingStylesToAED = async (
    updates: PackingStyleTransitUpdate[],
    updatedBy: mongoose.Types.ObjectId,
) => {
    try {
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new Error("PACKING_STYLE_TRANSIT_REQUIRED");
        }

        const styleIds = updates.map((item) => item?.styleId);

        if (
            styleIds.some(
                (id) =>
                    typeof id !== "string" ||
                    !mongoose.isValidObjectId(id),
            )
        ) {
            throw new Error("PACKING_STYLE_ID_INVALID");
        }

        if (new Set(styleIds).size !== styleIds.length) {
            throw new Error("DUPLICATE_PACKING_STYLE_ID");
        }

        for (const item of updates) {
            if (
                !item.transit ||
                typeof item.transit.perPcAED !== "number" ||
                !Number.isFinite(item.transit.perPcAED) ||
                item.transit.perPcAED < 0 ||
                typeof item.transit.expenseRecAED !== "number" ||
                !Number.isFinite(item.transit.expenseRecAED) ||
                item.transit.expenseRecAED < 0 ||
                typeof item.transit.updatedUnitRateAED !== "number" ||
                !Number.isFinite(item.transit.updatedUnitRateAED) ||
                item.transit.updatedUnitRateAED < 0
            ) {
                throw new Error("PACKING_STYLE_TRANSIT_INVALID");
            }
        }

        const existingStyles = await packingListRepo.findStylesByIds(
            styleIds,
        );

        const existingIds = new Set(
            existingStyles.map((style) => style.styleId.toString()),
        );

        if (styleIds.some((id) => !existingIds.has(id))) {
            throw new Error("PACKING_STYLE_NOT_FOUND");
        }

        const result = await packingListRepo.updateStylesTransit(
            updates,
            updatedBy,
        );

        logger.info(
            `Packing style AED conversion completed: ${updates.length} styles`,
        );

        return {
            updatedCount: result.modifiedCount,
        };
    } catch (error) {
        logger.error("Failed to convert packing styles to AED", error);
        throw error;
    }
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
updatePackingListsStatus
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