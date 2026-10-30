import * as reportsRepository from "./reportsRepository";
import { getPaginationMeta } from "../../utils/pagination";
import { getMainStockLines } from "../stock/stockService";
import {
    getCustomerOutstandingMap,
    getVendorOutstandingMap,
} from "../stock/ledgerService";
import { getSampleStoreStock } from "../indianStoreStockTransfer/indianStoreStockTransferService";
import {
    getReturnStoreStockService,
    getUAEMainStockService,
} from "../uaeStoreStockTransfer/uaeStoreStockTransferService";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import ReceiptEntryModel from "../../models/receiptEntryModel";
import BillingModel from "../../models/billingModel";
import DailyExpenseModel from "../../models/dailyExpenseModel";
import UAEStoreStockTransferModel from "../../models/uaeStoreStockTransferModel";
import { round2 } from "../../utils/errorStatus";

export const getAllPurchaseEntryReportsService = async (
    page: number,
    limit: number,
) => {
    return reportsRepository.findAllPurchaseEntryReports(page, limit);
};
export const getAllSalesReportsService = async (
    page: number,
    limit: number,
    billId?: string,
) => {
    return reportsRepository.findAllSalesReports(page, limit, billId);
};
export const getAllDebitReportsService = async (
    page: number,
    limit: number,
) => {
    return reportsRepository.findAllDebitReports(page, limit);
};
export const getAllTransitReportsService = async (
    page: number,
    limit: number,
) => {
    return reportsRepository.findAllTransitReports(page, limit);
};
// ---- Reports derived from live stock / ledgers (same as the UI tabs) ----
const paginate = <T>(rows: T[], page: number, limit: number) => ({
    data: rows.slice((page - 1) * limit, page * limit),
    pagination: getPaginationMeta(page, limit, rows.length),
});

export const getIndStockReportService = async (page: number, limit: number) => {
    const rows = (await getMainStockLines()).map((line) => ({
        ...line,
        value: round2(line.availableQty * line.rate),
    }));

    return paginate(rows, page, limit);
};

export const getUAEStockReportService = async (page: number, limit: number) => {
    const { data } = await getUAEMainStockService();

    return paginate(
        data.map((row: any) => ({ ...row, value: round2(row.qty * row.costAED) })),
        page,
        limit,
    );
};

export const getSampleStockReportService = async (page: number, limit: number) => {
    const { data } = await getSampleStoreStock();

    return paginate(
        data.map((row) => ({ ...row, value: round2(row.sampleQty * row.rate) })),
        page,
        limit,
    );
};

/** Credit report: money received from customers (receipts). */
export const getCreditReportService = async (page: number, limit: number) => {
    const receipts = await ReceiptEntryModel.find({ isDeleted: false })
        .populate("invoice", "invoiceNo date")
        .populate("customer", "name")
        .sort({ receiptDate: -1, createdAt: -1 })
        .lean();

    return paginate(receipts, page, limit);
};

/** Damage report: QC damage in India and damaged customer returns in UAE. */
export const getDamageReportService = async (page: number, limit: number) => {
    const [qualityChecks, returns] = await Promise.all([
        PurchaseQualityCheckModel.find({
            isDeleted: false,
            totalDamagedQty: { $gt: 0 },
        })
            .populate("purchaseEntry", "invoiceNo purchaseDate")
            .lean<any[]>(),
        UAEStoreStockTransferModel.find({ isDeleted: false, reason: "Damage" })
            .sort({ returnDate: -1 })
            .lean<any[]>(),
    ]);

    const rows = [
        ...qualityChecks.flatMap((qc) =>
            qc.products
                .filter((product: any) => product.damageQty > 0)
                .map((product: any) => ({
                    source: "QC damage (IND)",
                    reference: qc.purchaseEntry?.invoiceNo,
                    date: qc.purchaseEntry?.purchaseDate,
                    productName: product.productName,
                    qty: product.damageQty,
                    value: round2(product.damageQty * product.purchaseRate),
                    currency: "INR",
                })),
        ),
        ...returns.flatMap((record) =>
            record.products.map((product: any) => ({
                source: "Customer return (UAE)",
                reference: record.invoiceNo,
                date: record.returnDate,
                productName: product.productName,
                qty: product.returnedQty,
                value: product.returnValue,
                currency: "AED",
            })),
        ),
    ];

    return paginate(rows, page, limit);
};

export const getReturnReportService = async (page: number, limit: number) => {
    const { data } = await getReturnStoreStockService();

    return paginate(
        data.map((row) => ({
            ...row,
            value: round2(row.returnedQty * row.unitPrice),
        })),
        page,
        limit,
    );
};

/** Dashboard tiles and pending actions. */
export const getDashboardService = async () => {
    const [
        vendorOutstanding,
        customerOutstanding,
        mainLines,
        uaeStock,
        sales,
        expenses,
        qcPending,
        openExpenses,
        customerBalances,
    ] = await Promise.all([
        getVendorOutstandingMap(),
        getCustomerOutstandingMap(),
        getMainStockLines(),
        getUAEMainStockService(),
        BillingModel.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, total: { $sum: "$netAmount" } } },
        ]),
        DailyExpenseModel.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        PurchaseEntryModel.countDocuments({ isDeleted: false, qcStatus: "Pending" }),
        DailyExpenseModel.countDocuments({ isDeleted: false, packingId: "Open" }),
        BillingModel.countDocuments({ isDeleted: false, balanceAmount: { $gt: 0.5 } }),
    ]);

    const sum = (values: Iterable<number>) =>
        round2([...values].reduce((total, value) => total + value, 0));

    return {
        stats: {
            vendorOutstanding: sum(vendorOutstanding.values()),
            customerOutstanding: sum(customerOutstanding.values()),
            indMainStockValue: round2(
                mainLines.reduce(
                    (total, line) => total + line.availableQty * line.rate,
                    0,
                ),
            ),
            uaeMainStockValue: uaeStock.summary.stockValue,
            netSales: round2(sales[0]?.total ?? 0),
            expensesBooked: round2(expenses[0]?.total ?? 0),
        },
        pendingActions: {
            purchaseInvoicesWaitingForQC: qcPending,
            vendorsWithBalance: [...vendorOutstanding.values()].filter(
                (value) => value > 0.5,
            ).length,
            customerInvoicesWithBalance: customerBalances,
            expensesNotAttachedToPackingList: openExpenses,
        },
    };
};
