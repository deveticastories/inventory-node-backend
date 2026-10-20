import mongoose from "mongoose";
import * as packingListRepo from "./packingListRepository";
import type { PackingListStatus } from "../../models/packingListModel";
import DailyExpenseModel from "../../models/dailyExpenseModel";

import logger from "../../utils/logger";

const MAX_PACKING_ID_RETRIES = 3;

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