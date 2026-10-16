import mongoose from "mongoose";
import Customer from "../../models/customerModel";
import { getPaginationMeta } from "../../utils/pagination";

export const create = async (customerData: Record<string, unknown>) => {
    const customer = new Customer(customerData);
    return customer.save();
};

export const findById = async (id: string) => {
    return Customer.findOne({
        _id: id,
        isDeleted: false,
    }).exec();
};

export const findByEmail = async (
    email: string,
    excludeId?: string,
) => {
    const filter: Record<string, unknown> = {
        email: email.trim().toLowerCase(),
        isDeleted: false,
    };

    if (excludeId) {
        filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    return Customer.findOne(filter).exec();
};

export const findByWhatsAppNo = async (
    whatsAppNo: string,
    excludeId?: string,
) => {
    const filter: Record<string, unknown> = {
        whatsAppNo: whatsAppNo.trim(),
        isDeleted: false,
    };

    if (excludeId) {
        filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    return Customer.findOne(filter).exec();
};

export const getAllCustomers = async (page: number, limit: number) => {
    const filter = { isDeleted: false };
    const skip = (page - 1) * limit;

    const [customers, totalRecords] = await Promise.all([
        Customer.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
        Customer.countDocuments(filter).exec(),
    ]);

    return {
        data: customers,
        pagination: getPaginationMeta(page, limit, totalRecords),
    };
};

export const updateById = async (
    id: string,
    updateData: Record<string, unknown>,
) => {
    return Customer.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updateData },
        { new: true, runValidators: true },
    ).exec();
};

export const deleteCustomer = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    return Customer.findOneAndUpdate(
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