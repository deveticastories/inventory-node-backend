import mongoose from "mongoose";
import Vendor, { type VendorDocument } from "../../models/vendorModel";
import { getPaginationMeta } from "../../utils/pagination";
import PurchaseEntryModel from "../../models/purchaseEntryModel";

export const create = async (
  vendorData: Partial<VendorDocument>,
): Promise<VendorDocument> => {
  const vendor = new Vendor(vendorData);
  return vendor.save();
};

export const findById = async (
  id: string,
): Promise<VendorDocument | null> => {
  return Vendor.findOne({ _id: id, isDeleted: false }).exec();
};

export const findByName = async (
  vendorName: string,
  excludeId?: string,
): Promise<VendorDocument | null> => {
  const filter: Record<string, unknown> = {
    vendorName: vendorName.trim(),
    isDeleted: false,
  };

  if (excludeId) {
    filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  return Vendor.findOne(filter).exec();
};

export const findByContactNo = async (
  contactNo: string,
  excludeId?: string,
): Promise<VendorDocument | null> => {
  const filter: Record<string, unknown> = {
    contactNo: contactNo.trim(),
    isDeleted: false,
  };

  if (excludeId) {
    filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  return Vendor.findOne(filter).exec();
};

export const getAllVendors = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };

  const [vendors, totalRecords] = await Promise.all([
    Vendor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    Vendor.countDocuments(filter).exec(),
  ]);

  return {
    data: vendors,
    pagination: getPaginationMeta(page, limit, totalRecords),
  };
};

export const updateById = async (
  id: string,
  updateData: Partial<VendorDocument>,
): Promise<VendorDocument | null> => {
  return Vendor.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: updateData },
    { new: true, runValidators: true },
  ).exec();
};

export const deleteVendor = async (
  id: string,
  deletedBy: mongoose.Types.ObjectId,
): Promise<VendorDocument | null> => {
  return Vendor.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
      },
    },
    { new: true },
  ).exec();
};