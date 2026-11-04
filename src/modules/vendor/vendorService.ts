import mongoose from "mongoose";
import * as vendorRepo from "./vendorRepository";
import { message } from "../../constants/responseMessage";

import type { VendorDocument } from "../../models/vendorModel";
import { CreateVendorInput, UpdateVendorInput } from "../../validation/vendorValidation";
import {
  getVendorLedger,
  getVendorOutstandingMap,
} from "../stock/ledgerService";

export const createVendor = async (
  vendorData: CreateVendorInput,
): Promise<VendorDocument> => {
  const existingContact = await vendorRepo.findByContactNo(
    vendorData.contactNo,
  );



  return vendorRepo.create(vendorData);
};

export const getAllVendors = async (page: number, limit: number) => {
  const [result, outstanding] = await Promise.all([
    vendorRepo.getAllVendors(page, limit),
    getVendorOutstandingMap(),
  ]);

  return {
    ...result,
    data: result.data.map((vendor) => ({
      ...vendor.toObject(),
      outstandingAmount: outstanding.get(vendor._id.toString()) ?? 0,
    })),
  };
};

/** Vendor details page: outstanding, last purchases and payment history. */
export const getVendorDetails = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid vendor ID");
  }

  const vendor = await vendorRepo.findById(id);

  if (!vendor) return null;

  return {
    vendor,
    ...(await getVendorLedger(id)),
  };
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
