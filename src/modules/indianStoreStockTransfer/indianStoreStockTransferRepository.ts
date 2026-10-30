import mongoose from "mongoose";
import IndianStoreStockTransfer from "../../models/indianStoreStockTransferModel";
import Store from "../../models/storeModel";

export const findStoreById = async (storeId: string) => {
    if (!mongoose.isValidObjectId(storeId)) {
        return null;
    }

    return Store.findOne({
        _id: new mongoose.Types.ObjectId(storeId),
        isDeleted: false,
    }).exec();
};

/** Sample qty per QC product, optionally only for one destination store. */
export const getSampleQtyByProduct = async (toStore?: string) => {
    const rows: {
        _id: mongoose.Types.ObjectId;
        qty: number;
        lastTransferDate: Date;
    }[] = await IndianStoreStockTransfer.aggregate([
        {
            $match: {
                isDeleted: false,
                ...(toStore && {
                    toStore: new mongoose.Types.ObjectId(toStore),
                }),
            },
        },
        { $unwind: "$products" },
        {
            $group: {
                _id: "$products.qualityCheckProduct",
                qty: { $sum: "$products.transferredQty" },
                lastTransferDate: { $max: "$transferDate" },
            },
        },
    ]);

    return rows;
};

export const createIndianStoreStockTransfer = async (
    transferData: Record<string, unknown>,
) => {
    const transfer = new IndianStoreStockTransfer(transferData);
    await transfer.save();

    return IndianStoreStockTransfer.findById(transfer._id)
        .populate("fromStore")
        .populate("toStore")
        .exec();
};

export const findIndianStoreStockTransferById = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        return null;
    }

    return IndianStoreStockTransfer.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
    })
        .populate("fromStore")
        .populate("toStore")
        .exec();
};

export const findAllIndianStoreStockTransfers = async (
    page: number,
    limit: number,
    search?: string,
    fromStore?: string,
    toStore?: string,
) => {
    const filter: Record<string, any> = {
        isDeleted: false,
    };

    if (fromStore) {
        filter.fromStore = new mongoose.Types.ObjectId(fromStore);
    }

    if (toStore) {
        filter.toStore = new mongoose.Types.ObjectId(toStore);
    }

    if (search?.trim()) {
        filter["products.productName"] = {
            $regex: search.trim(),
            $options: "i",
        };
    }

    const skip = (page - 1) * limit;

    const [transfers, totalRecords] = await Promise.all([
        IndianStoreStockTransfer.find(filter)
            .populate("fromStore")
            .populate("toStore")
            .sort({ transferDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        IndianStoreStockTransfer.countDocuments(filter),
    ]);

    return {
        data: transfers,
        totalRecords,
    };
};
