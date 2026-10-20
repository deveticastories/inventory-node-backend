import mongoose from "mongoose";
import * as packingListRepo from "./packingListRepository";
import logger from "../../utils/logger";

export const createPackingList = async (
    packingListData: Record<string, unknown>,
    createdBy: mongoose.Types.ObjectId,
) => {
    try {
        logger.info("Creating packing list");

        const packingId = await packingListRepo.generatePackingId();

        const packingList = await packingListRepo.create({
            ...packingListData,
            packingId,
            createdBy,
        });

        logger.info(`Packing list created successfully: ${packingId}`);

        return packingList;
    } catch (error) {
        logger.error("Failed to create packing list", error);
        throw error;
    }
};

export const getAllPackingLists = async (
    page: number,
    limit: number,
) => {
    try {
        logger.info(
            `Fetching packing lists: page=${page}, limit=${limit}`,
        );

        const result = await packingListRepo.getAllPackingLists(
            page,
            limit,
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

        logger.info(`Packing list fetched successfully: ${id}`);

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

        const packingList = await packingListRepo.findById(id);

        if (!packingList) {
            logger.warn(`Packing list not found for update: ${id}`);
            return null;
        }

        const { packingId: _packingId, ...editableData } = updateData;

        const updatedPackingList = await packingListRepo.updateById(id, {
            ...editableData,
            updatedBy,
            userUpdatedDate: new Date(),
        });

        logger.info(`Packing list updated successfully: ${id}`);

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

        logger.info(`Packing list deleted successfully: ${id}`);

        return deletedPackingList;
    } catch (error) {
        logger.error(`Failed to delete packing list: ${id}`, error);
        throw error;
    }
};