import mongoose from "mongoose";
import User from "../../models/userModel";
import * as storeRepo from "./storeRepository";
import { CreateStoreInput, UpdateStoreInput } from "../../validation/storeValidation";


export const createStore = async (
  storeData: CreateStoreInput,
  createdBy: mongoose.Types.ObjectId,
) => {
  const existingContact = await storeRepo.findByContactNumber(
    storeData.contactNumber,
  );

  if (existingContact) {
    throw new Error("A store with this contact number already exists");
  }

  const userExists = await User.exists({
    _id: storeData.inCharge,
    isDeleted: false,
  });

  if (!userExists) {
    throw new Error("Assigned user not found");
  }

  return storeRepo.create({
    ...storeData,
    inCharge: new mongoose.Types.ObjectId(storeData.inCharge),
    createdBy,
  });
};

export const getAllStores = async (page: number, limit: number) => {
  return storeRepo.getAllStores(page, limit);
};

export const getStoreById = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid store ID");
  }

  return storeRepo.findById(id);
};

export const editStore = async (
  id: string,
  updateData: UpdateStoreInput,
  updatedBy: mongoose.Types.ObjectId,
) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid store ID");
  }

  const existingStore = await storeRepo.findById(id);

  if (!existingStore) {
    return null;
  }

  if (updateData.contactNumber) {
    const existingContact = await storeRepo.findByContactNumber(
      updateData.contactNumber,
      id,
    );

    if (existingContact) {
      throw new Error("A store with this contact number already exists");
    }
  }

  if (updateData.inCharge) {
    const userExists = await User.exists({
      _id: updateData.inCharge,
      isDeleted: false,
    });

    if (!userExists) {
      throw new Error("Assigned user not found");
    }
  }

  const updates: Record<string, unknown> = {
    ...updateData,
    updatedBy,
    userUpdatedDate: new Date(),
  };

  if (updateData.inCharge) {
    updates.inCharge = new mongoose.Types.ObjectId(updateData.inCharge);
  }

  return storeRepo.updateById(id, updates);
};

export const deleteStore = async (
  id: string,
  deletedBy: mongoose.Types.ObjectId,
) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid store ID");
  }

  return storeRepo.deleteStore(id, deletedBy);
};
