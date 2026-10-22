import PurchaseEntryModel from "../../models/purchaseEntryModel";
import PaymentEntryModel from "../../models/paymentEntryModel";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import VendorModel from "../../models/vendorModel";
import { getPaginationMeta } from "../../utils/pagination";
import mongoose from "mongoose";
import BillingModel from "../../models/billingModel";
import CustomerModel from "../../models/customerModel";
import ReceiptEntryModel from "../../models/receiptEntryModel";

export const findAllPurchaseEntryReports = async (
    page: number,
    limit: number,
) => {
    const skip = (page - 1) * limit;

    const result = await PurchaseEntryModel.aggregate([
        { $match: { isDeleted: false } },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: VendorModel.collection.name,
                            localField: "vendor",
                            foreignField: "_id",
                            as: "vendor",
                        },
                    },
                    {
                        $unwind: {
                            path: "$vendor",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: PurchaseQualityCheckModel.collection.name,
                            let: { purchaseEntryId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: [
                                                "$purchaseEntry",
                                                "$$purchaseEntryId",
                                            ],
                                        },
                                        isDeleted: false,
                                    },
                                },
                                { $limit: 1 },
                            ],
                            as: "qualityCheck",
                        },
                    },
                    {
                        $unwind: {
                            path: "$qualityCheck",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: PaymentEntryModel.collection.name,
                            let: { purchaseEntryId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: [
                                                "$purchaseInvoice",
                                                "$$purchaseEntryId",
                                            ],
                                        },
                                        isDeleted: false,
                                    },
                                },
                                { $sort: { createdAt: -1 } },
                            ],
                            as: "payments",
                        },
                    },
                    {
                        $project: {
                            __v: 0,
                            "vendor.__v": 0,
                            "qualityCheck.__v": 0,
                            "payments.__v": 0,
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
export const findAllSalesReports = async (
    page: number,
    limit: number,
    billId?: string,
) => {
    const skip = (page - 1) * limit;

    const match: Record<string, unknown> = {
        isDeleted: false,
    };

    if (billId) {
        if (!mongoose.Types.ObjectId.isValid(billId)) {
            throw new Error("INVALID_BILL_ID");
        }

        match._id = new mongoose.Types.ObjectId(billId);
    }

    const result = await BillingModel.aggregate([
        { $match: match },
        { $sort: { date: -1, createdAt: -1 } },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: CustomerModel.collection.name,
                            localField: "customer",
                            foreignField: "_id",
                            as: "customer",
                        },
                    },
                    {
                        $unwind: {
                            path: "$customer",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: ReceiptEntryModel.collection.name,
                            let: { billingId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ["$invoice", "$$billingId"],
                                        },
                                        isDeleted: false,
                                    },
                                },
                                { $sort: { createdAt: -1 } },
                            ],
                            as: "receipts",
                        },
                    },
                    {
                        $addFields: {
                            totalReceivedFromReceipts: {
                                $sum: "$receipts.receivedAmount",
                            },
                            totalReceiptCount: {
                                $size: "$receipts",
                            },
                        },
                    },
                    {
                        $project: {
                            __v: 0,
                            "customer.__v": 0,
                            "receipts.__v": 0,
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