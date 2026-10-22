import mongoose from "mongoose";
import * as vendorRepo from "./vendorRepository";
import { message } from "../../constants/responseMessage";

import type { VendorDocument } from "../../models/vendorModel";
import { CreateVendorInput, UpdateVendorInput } from "../../validation/vendorValidation";

export const createVendor = async (
  vendorData: CreateVendorInput,
): Promise<VendorDocument> => {
  const existingContact = await vendorRepo.findByContactNo(
    vendorData.contactNo,
  );

  if (existingContact) {
    throw new Error("A vendor with this contact number already exists");
  }

  return vendorRepo.create(vendorData);
};

export const getAllVendors = async (page: number, limit: number) => {
  return vendorRepo.getAllVendors(page, limit);
};

export const getVendorById = async (
  id: string,
): Promise<VendorDocument | null> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid vendor ID");
  }

  return vendorRepo.findById(id);
};

export const editVendor = async (
  id: string,
  updateData: UpdateVendorInput,
): Promise<VendorDocument | null> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid vendor ID");
  }

  if (updateData.contactNo) {
    const existingContact = await vendorRepo.findByContactNo(
      updateData.contactNo,
      id,
    );

    if (existingContact) {
      throw new Error("A vendor with this contact number already exists");
    }
  }

  return vendorRepo.updateById(id, updateData);
};

export const deleteVendor = async (
  id: string,
  deletedBy: string,
): Promise<VendorDocument | null> => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid vendor ID");
  }

  if (!mongoose.isValidObjectId(deletedBy)) {
    throw new Error("Invalid authenticated user ID");
  }

  return vendorRepo.deleteVendor(
    id,
    new mongoose.Types.ObjectId(deletedBy),
  );
};
