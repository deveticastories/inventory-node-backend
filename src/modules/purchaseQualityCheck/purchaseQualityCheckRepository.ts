import mongoose from "mongoose";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import VendorModel from "../../models/vendorModel";
import UserModel from "../../models/userModel";

export const findPurchaseEntryById = (id: string) => {
    return PurchaseEntryModel.findOne({
        _id: id,
        isDeleted: false,
    }).lean();
};

export const findQualityCheckByPurchaseEntry = (
    purchaseEntry: mongoose.Types.ObjectId,
) => {
    return PurchaseQualityCheckModel.findOne({
        purchaseEntry,
        isDeleted: false,
    }).lean();
};

export const findQualityCheckById = (id: string) => {
    return PurchaseQualityCheckModel.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate({
            path: "purchaseEntry",
            populate: {
                path: "vendor",
                model: VendorModel,
            },
        })
        .populate({
            path: "checkedBy",
            model: UserModel,
            select: "firstName lastName email",
        })
        .lean();
};

export const createQualityCheck = (
    data: Record<string, unknown>,
) => {
    return PurchaseQualityCheckModel.create(data);
};

export const updateQualityCheck = (
    purchaseEntry: mongoose.Types.ObjectId,
    data: Record<string, unknown>,
) => {
    return PurchaseQualityCheckModel.findOneAndUpdate(
        {
            purchaseEntry,
            isDeleted: false,
        },
        {
            $set: data,
        },
        {
            new: true,
            runValidators: true,
        },
    );
};

export const updatePurchaseEntryQCStatus = (id: string) => {
    return PurchaseEntryModel.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            $set: {
                qcStatus: "Done",
            },
        },
        {
            new: true,
            runValidators: true,
        },
    );
};

export const findAllQualityChecks = () => {
    return PurchaseQualityCheckModel.find({
        isDeleted: false,
    })
        .populate({
            path: "purchaseEntry",
            populate: {
                path: "vendor",
                model: VendorModel,
            },
        })
        .populate({
            path: "checkedBy",
            model: UserModel,
            select: "firstName lastName email",
        })
        .sort({
            createdAt: -1,
        })
        .lean();
};