import mongoose from "mongoose";
import UAEStoreStockTransferModel, {
    type UAEStoreStockTransfer,
} from "../../models/uaeStoreStockTransferModel";
import PackingListModel from "../../models/packingListModel";

export const createUAEStoreStockTransfer = async (
    data: Partial<UAEStoreStockTransfer>,
) => {
    return UAEStoreStockTransferModel.create(data);
};

export const findAllUAEStoreStockTransfers = async (
    page: number,
    limit: number,
    packingList?: string,
    fromStore?: string,
    toStore?: string,
) => {
    const filter: Record<string, unknown> = {
        isDeleted: false,
    };

    if (packingList) {
        filter.packingList = new mongoose.Types.ObjectId(packingList);
    }

    if (fromStore) {
        filter.fromStore = new mongoose.Types.ObjectId(fromStore);
    }

    if (toStore) {
        filter.toStore = new mongoose.Types.ObjectId(toStore);
    }

    const [data, totalRecords] = await Promise.all([
        UAEStoreStockTransferModel.find(filter)
            .populate("packingList")
            .populate("fromStore")
            .populate("toStore")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        UAEStoreStockTransferModel.countDocuments(filter),
    ]);

    return { data, totalRecords };
};

export const findUAEStoreStockTransferById = async (id: string) => {
    return UAEStoreStockTransferModel.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate("packingList")
        .populate("fromStore")
        .populate("toStore");
};

export const updateUAEStoreStockTransferById = async (
    id: string,
    data: Partial<UAEStoreStockTransfer>,
) => {
    return UAEStoreStockTransferModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: data },
        { new: true, runValidators: true },
    )
        .populate("packingList")
        .populate("fromStore")
        .populate("toStore");
};

export const softDeleteUAEStoreStockTransferById = async (id: string) => {
    return UAEStoreStockTransferModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        },
        { new: true },
    );
};

export const findAvailablePackingListsForFromStore = async (
    page: number,
    limit: number,
) => {
    const returnedPackingListIds =
        await UAEStoreStockTransferModel.distinct("packingList", {
            isDeleted: false,
        });

    const filter = {
        isDeleted: false,
        _id: {
            $nin: returnedPackingListIds,
        },
    };

    const [data, totalRecords] = await Promise.all([
        PackingListModel.find(filter)
            .sort({ packingDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),

        PackingListModel.countDocuments(filter),
    ]);

    return {
        data,
        totalRecords,
    };
};
export const findReturnedPackingListsForToStore = async (
    toStore: string,
    page: number,
    limit: number,
) => {
    if (!mongoose.Types.ObjectId.isValid(toStore)) {
        throw new Error("TO_STORE_ID_INVALID");
    }

    const returnedPackingListIds =
        await UAEStoreStockTransferModel.distinct("packingList", {
            toStore: new mongoose.Types.ObjectId(toStore),
            isDeleted: false,
        });

    const filter = {
        isDeleted: false,
        _id: { $in: returnedPackingListIds },
    };

    const [data, totalRecords] = await Promise.all([
        PackingListModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        PackingListModel.countDocuments(filter),
    ]);

    return { data, totalRecords };
};