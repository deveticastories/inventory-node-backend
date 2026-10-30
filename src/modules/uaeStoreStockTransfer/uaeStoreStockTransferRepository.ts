import mongoose from "mongoose";
import UAEStoreStockTransferModel from "../../models/uaeStoreStockTransferModel";
import UAEMainStockModel from "../../models/uaeMainStockModel";

export const findUAEMainStock = async () => {
    return UAEMainStockModel.find({ isDeleted: false })
        .sort({ transitDate: -1, createdAt: -1 })
        .lean();
};

export const findActiveReturns = async (filter: Record<string, unknown> = {}) => {
    return UAEStoreStockTransferModel.find({ isDeleted: false, ...filter })
        .populate("invoice", "invoiceNo date customer invoiceTotal returnAmount netAmount")
        .sort({ returnDate: -1, createdAt: -1 })
        .lean();
};

export const createUAEStoreStockTransfer = async (
    data: Record<string, unknown>,
) => {
    return UAEStoreStockTransferModel.create(data);
};

export const findAllUAEStoreStockTransfers = async (
    page: number,
    limit: number,
    invoice?: string,
) => {
    const filter: Record<string, unknown> = {
        isDeleted: false,
    };

    if (invoice) {
        filter.invoice = new mongoose.Types.ObjectId(invoice);
    }

    const [data, totalRecords] = await Promise.all([
        UAEStoreStockTransferModel.find(filter)
            .populate("invoice", "invoiceNo date customer invoiceTotal returnAmount netAmount")
            .sort({ returnDate: -1, createdAt: -1 })
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
    }).populate(
        "invoice",
        "invoiceNo date customer invoiceTotal returnAmount netAmount",
    );
};

export const findLatestReturnNo = async () => {
    const latest = await UAEStoreStockTransferModel.findOne({
        returnNo: { $regex: /^RET-\d+$/ },
    })
        .sort({ createdAt: -1 })
        .select("returnNo")
        .lean<{ returnNo: string }>();

    return latest?.returnNo ?? null;
};

export const softDeleteUAEStoreStockTransferById = async (
    id: string,
    deletedBy?: mongoose.Types.ObjectId,
) => {
    return UAEStoreStockTransferModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy,
            },
        },
        { new: true },
    );
};
