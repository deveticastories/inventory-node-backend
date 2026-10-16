import mongoose from "mongoose";
import Store from "../../models/storeModel";
import { getPaginationMeta } from "../../utils/pagination";

export const create = async (
  storeData: Record<string, unknown>,
) => {
  const store = new Store(storeData);
  return store.save();
};

export const findById = async (id: string) => {
  const objectId = new mongoose.Types.ObjectId(id);

  const result = await Store.aggregate([
    {
      $match: {
        _id: objectId,
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "inCharge",
        foreignField: "_id",
        as: "inCharge",
      },
    },
    {
      $unwind: {
        path: "$inCharge",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        "inCharge.password": 0,
        "inCharge.__v": 0,
      },
    },
  ]);

  return result[0] ?? null;
};

export const findByContactNumber = async (
  contactNumber: string,
  excludeId?: string,
) => {
  const match: Record<string, unknown> = {
    contactNumber: contactNumber.trim(),
    isDeleted: false,
  };

  if (excludeId) {
    match._id = {
      $ne: new mongoose.Types.ObjectId(excludeId),
    };
  }

  return Store.findOne(match).exec();
};

export const getAllStores = async (
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  const result = await Store.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "inCharge",
              foreignField: "_id",
              as: "inCharge",
            },
          },
          {
            $unwind: {
              path: "$inCharge",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              "inCharge.password": 0,
              "inCharge.__v": 0,
            },
          },
        ],
        totalRecords: [{ $count: "count" }],
      },
    },
  ]);

  const data = result[0]?.data ?? [];
  const totalRecords = result[0]?.totalRecords[0]?.count ?? 0;

  return {
    data,
    pagination: getPaginationMeta(page, limit, totalRecords),
  };
};

export const updateById = async (
  id: string,
  updateData: Record<string, unknown>,
) => {
  return Store.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    {
      $set: updateData,
    },
    {
      new: true,
      runValidators: true,
    },
  ).exec();
};

export const deleteStore = async (
  id: string,
  deletedBy: mongoose.Types.ObjectId,
) => {
  return Store.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
      },
    },
    {
      new: true,
    },
  ).exec();
};
