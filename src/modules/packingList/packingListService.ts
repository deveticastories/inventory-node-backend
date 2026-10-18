import mongoose from "mongoose";
import * as packingListRepo from "./packingListRepository";

export const createPackingList = async (
    packingListData: Record<string, unknown>,
    createdBy: mongoose.Types.ObjectId,
) => {
    const packingId = await packingListRepo.generatePackingId();

    return packingListRepo.create({
        ...packingListData,
        packingId,
        createdBy,
    });
};

export const getAllPackingLists = async (
    page: number,
    limit: number,
) => {
    return packingListRepo.getAllPackingLists(page, limit);
};

export const getPackingListById = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PACKING_LIST_ID_INVALID");
    }

    return packingListRepo.findById(id);
};

export const editPackingList = async (
    id: string,
    updateData: Record<string, unknown>,
    updatedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PACKING_LIST_ID_INVALID");
    }

    const packingList = await packingListRepo.findById(id);

    if (!packingList) {
        return null;
    }

    const { packingId: _packingId, ...editableData } = updateData;

    return packingListRepo.updateById(id, {
        ...editableData,
        updatedBy,
        userUpdatedDate: new Date(),
    });
};

export const deletePackingList = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PACKING_LIST_ID_INVALID");
    }

    return packingListRepo.deletePackingList(id, deletedBy);
};