import mongoose from "mongoose";
import User, { type UserDocument } from "../../models/userModel";
import { getPaginationMeta } from "../../utils/pagination";

export const create = async (
  userData: Partial<UserDocument>,
): Promise<UserDocument> => {
  const user = new User(userData);

  return await user.save();
};

export const findById = async (
  id: string,
): Promise<UserDocument | null> => {
  return User.findById(id)
    .where({ isDeleted: false })
    .exec();
};

export const updateById = async (
  id: string,
  updateData: Partial<UserDocument>,
): Promise<UserDocument | null> => {
  return User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: updateData },
    { new: true, runValidators: true },
  ).exec();
};

export const getAllUsers = async (
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  const [users, totalRecords] = await Promise.all([
    User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),

    User.countDocuments({ isDeleted: false }).exec(),
  ]);

  return {
    data: users,
    pagination: getPaginationMeta(page, limit, totalRecords),
  };
};
export const deleteUser = async (
  userId: string,
  deletedBy: mongoose.Types.ObjectId,
): Promise<UserDocument | null> => {
  return User.findOneAndUpdate(
    { _id: userId, isDeleted: false },
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

export const changeUserStatus = async (
  id: string,
  updatedData: Partial<UserDocument>,
): Promise<UserDocument | null> => {
  return User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      $set: {
        status: updatedData.status,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).exec();
};

export const findByEmail = async (
  email: string,
): Promise<UserDocument | null> => {
  return User.findOne({
    email: email.trim().toLowerCase(),
    isDeleted: false,
  }).exec();
};

export const findByEmployeeId = async (
  employeeId: string,
): Promise<UserDocument | null> => {
  return User.findOne({
    employeeId: employeeId.trim(),
    isDeleted: false,
  }).exec();
};

export const findByMobileNumber = async (
  mobileNumber: string,
): Promise<UserDocument | null> => {
  return User.findOne({
    mobileNumber: mobileNumber.trim(),
    isDeleted: false,
  }).exec();
};
