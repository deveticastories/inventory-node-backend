import PurchaseEntryModel from "../../models/purchaseEntryModel";
import PaymentEntryModel from "../../models/paymentEntryModel";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import VendorModel from "../../models/vendorModel";
import { getPaginationMeta } from "../../utils/pagination";
import mongoose from "mongoose";
import BillingModel from "../../models/billingModel";
import CustomerModel from "../../models/customerModel";
import ReceiptEntryModel from "../../models/receiptEntryModel";
import DailyExpenseModel from "../../models/dailyExpenseModel";
import PackingListModel from "../../models/packingListModel";
import UAEStoreStockTransferModel from "../../models/uaeStoreStockTransferModel";
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
export const findAllDebitReports = async (
    page: number,
    limit: number,
) => {
    const skip = (page - 1) * limit;

    const [paymentResult, expenseResult] = await Promise.all([
        PaymentEntryModel.aggregate([
            {
                $match: {
                    isDeleted: false,
                },
            },
            {
                $lookup: {
                    from: PurchaseEntryModel.collection.name,
                    localField: "purchaseInvoice",
                    foreignField: "_id",
                    as: "purchaseInvoice",
                },
            },
            {
                $unwind: {
                    path: "$purchaseInvoice",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: VendorModel.collection.name,
                    localField: "purchaseInvoice.vendor",
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
                $project: {
                    __v: 0,
                    "purchaseInvoice.__v": 0,
                    "vendor.__v": 0,
                },
            },
        ]),

        DailyExpenseModel.aggregate([
            {
                $match: {
                    isDeleted: false,
                },
            },
            {
                $project: {
                    __v: 0,
                },
            },
        ]),
    ]);

    const paymentRecords = paymentResult.map((payment) => ({
        ...payment,
        type: "PaymentEntry",
        reportDate: payment.createdAt,
    }));

    const expenseRecords = expenseResult.map((expense) => ({
        ...expense,
        type: "DailyExpense",
        reportDate: expense.date,
    }));

    const allRecords = [...paymentRecords, ...expenseRecords].sort(
        (a, b) =>
            new Date(b.reportDate).getTime() -
            new Date(a.reportDate).getTime(),
    );

    const totalRecords = allRecords.length;
    const data = allRecords.slice(skip, skip + limit);

    return {
        data,
        pagination: getPaginationMeta(page, limit, totalRecords),
    };
};
export const findAllTransitReports = async (
    page: number,
    limit: number,
) => {
    const skip = (page - 1) * limit;

    const result = await PackingListModel.aggregate([
        {
            $match: {
                isDeleted: false,
            },
        },
        {
            $sort: {
                packingDate: -1,
                createdAt: -1,
            },
        },
        {
            $facet: {
                data: [
                    {
                        $skip: skip,
                    },
                    {
                        $limit: limit,
                    },
                    {
                        $lookup: {
                            from: UAEStoreStockTransferModel.collection.name,
                            let: {
                                styleNumbers: "$styles.styleNo",
                            },
                            pipeline: [
                                {
                                    $match: {
                                        isDeleted: false,
                                    },
                                },
                                {
                                    $match: {
                                        $expr: {
                                            $gt: [
                                                {
                                                    $size: {
                                                        $filter: {
                                                            input: "$products",
                                                            as: "product",
                                                            cond: {
                                                                $in: [
                                                                    "$$product.styleNo",
                                                                    "$$styleNumbers",
                                                                ],
                                                            },
                                                        },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                    },
                                },
                                {
                                    $addFields: {
                                        products: {
                                            $filter: {
                                                input: "$products",
                                                as: "product",
                                                cond: {
                                                    $in: [
                                                        "$$product.styleNo",
                                                        "$$styleNumbers",
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                                {
                                    $project: {
                                        __v: 0,
                                        "products.__v": 0,
                                    },
                                },
                            ],
                            as: "uaeReturns",
                        },
                    },
                    {
                        $lookup: {
                            from: "dailyexpenses",
                            localField: "dailyExpenses",
                            foreignField: "_id",
                            as: "dailyExpenses",
                        },
                    },
                    {
                        $project: {
                            __v: 0,
                            "dailyExpenses.__v": 0,
                        },
                    },
                ],
                totalRecords: [
                    {
                        $count: "count",
                    },
                ],
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

