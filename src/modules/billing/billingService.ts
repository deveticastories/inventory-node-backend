import mongoose from "mongoose";
import BillingModel, { type BillingProduct } from "../../models/billingModel";
import CustomerModel from "../../models/customerModel";
import UAEMainStockModel from "../../models/uaeMainStockModel";
import ReceiptEntryModel from "../../models/receiptEntryModel";
import UAEStoreStockTransferModel from "../../models/uaeStoreStockTransferModel";
import {
    createBilling,
    findAllBillings,
    findBillingById,
    updateBillingById,
    softDeleteBillingById,
    generateInvoiceNo, updateBillingPaymentStatus
} from "./billingRepository";
import { round2 } from "../../utils/errorStatus";

type BillingInput = {
    date?: string | Date;
    customer: string;
    products: Array<{
        uaeMainStock: string;
        qty: number;
        unitPrice: number;
    }>;
};

type StockLine = { uaeMainStock: string; qty: number };

const isValidObjectId = (value: unknown): value is string =>
    typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const parseDate = (date: unknown) => {
    const value = date ? new Date(date as string) : new Date();

    if (Number.isNaN(value.getTime())) {
        throw new Error("BILLING_DATE_INVALID");
    }

    return value;
};

const validateCustomer = async (customer: unknown) => {
    if (!isValidObjectId(customer)) {
        throw new Error("CUSTOMER_ID_INVALID");
    }

    const exists = await CustomerModel.exists({
        _id: customer,
        isDeleted: false,
    });

    if (!exists) {
        throw new Error("CUSTOMER_NOT_FOUND");
    }

    return new mongoose.Types.ObjectId(customer);
};

/** Builds invoice lines from UAE_MAIN STORE rows (style no, product, cost). */1111111111
const prepareProducts = async (
    products: unknown,
): Promise<BillingProduct[]> => {
    if (!Array.isArray(products) || products.length === 0) {
        throw new Error("BILLING_PRODUCTS_REQUIRED");
    }

    for (const product of products) {
        if (!isValidObjectId(product?.uaeMainStock)) {
            throw new Error("UAE_MAIN_STOCK_ID_INVALID");
        }

        if (!Number.isInteger(product.qty) || product.qty < 1) {
            throw new Error("BILLING_QTY_INVALID");
        }

        if (
            typeof product.unitPrice !== "number" ||
            !Number.isFinite(product.unitPrice) ||
            product.unitPrice <= 0
        ) {
            throw new Error("UNIT_PRICE_INVALID");
        }
    }

    const ids = [...new Set(products.map((product) => product.uaeMainStock))];
    const stockRows = await UAEMainStockModel.find({
        _id: { $in: ids },
        isDeleted: false,
    }).lean<any[]>();

    const stockById = new Map(stockRows.map((row) => [row._id.toString(), row]));

    return products.map((product) => {
        const stock = stockById.get(product.uaeMainStock);

        if (!stock) {
            throw new Error("UAE_MAIN_STOCK_NOT_FOUND");
        }

        return {
            uaeMainStock: stock._id,
            styleNo: stock.styleNo,
            productName: stock.productName,
            qty: product.qty,
            unitPrice: product.unitPrice,
            costAED: stock.costAED,
            amount: round2(product.qty * product.unitPrice),
        };
    });
};

const groupQty = (lines: StockLine[]) => {
    const qty = new Map<string, number>();

    for (const line of lines) {
        const key = String(line.uaeMainStock);
        qty.set(key, (qty.get(key) ?? 0) + line.qty);
    }

    return qty;
};

const restoreStock = async (lines: StockLine[]) => {
    for (const [id, qty] of groupQty(lines)) {
        await UAEMainStockModel.updateOne({ _id: id }, { $inc: { qty } });
    }
};

/** Deducts qty from UAE_MAIN STORE; all-or-nothing. */
const deductStock = async (lines: StockLine[]) => {
    const deducted: StockLine[] = [];

    for (const [id, qty] of groupQty(lines)) {
        const result = await UAEMainStockModel.updateOne(
            { _id: id, isDeleted: false, qty: { $gte: qty } },
            { $inc: { qty: -qty } },
        );

        if (result.modifiedCount !== 1) {
            await restoreStock(deducted);
            throw new Error("INSUFFICIENT_UAE_STOCK");
        }

        deducted.push({ uaeMainStock: id, qty });
    }
};

const toStockLines = (products: { uaeMainStock: unknown; qty: number }[]) =>
    products.map((product) => ({
        uaeMainStock: String(product.uaeMainStock),
        qty: product.qty,
    }));

const hasReceiptsOrReturns = async (billingId: mongoose.Types.ObjectId) => {
    const [receipt, returned] = await Promise.all([
        ReceiptEntryModel.exists({ invoice: billingId, isDeleted: false }),
        UAEStoreStockTransferModel.exists({ invoice: billingId, isDeleted: false }),
    ]);

    return Boolean(receipt || returned);
};

/**
 * Recomputes the derived amounts of an invoice:
 * net = invoice total - returns, balance = net - receipts.
 */
export const refreshBillingTotals = async (
    billingId: mongoose.Types.ObjectId | string,
) => {
    const id = new mongoose.Types.ObjectId(String(billingId));

    const [billing, returns, receipts] = await Promise.all([
        BillingModel.findById(id),
        UAEStoreStockTransferModel.aggregate([
            { $match: { invoice: id, isDeleted: false } },
            { $unwind: "$products" },
            { $group: { _id: null, total: { $sum: "$products.returnValue" } } },
        ]),
        ReceiptEntryModel.aggregate([
            { $match: { invoice: id, isDeleted: false } },
            { $group: { _id: null, total: { $sum: "$receivedAmount" } } },
        ]),
    ]);

    if (!billing) return null;

    billing.returnAmount = round2(returns[0]?.total ?? 0);
    billing.receivedAmount = round2(receipts[0]?.total ?? 0);
    billing.netAmount = round2(
        Math.max(0, billing.invoiceTotal - billing.returnAmount),
    );
    billing.balanceAmount = round2(
        Math.max(0, billing.netAmount - billing.receivedAmount),
    );

    return billing.save();
};

const computeTotals = (products: BillingProduct[]) => {
    const invoiceTotal = round2(
        products.reduce((total, product) => total + product.amount, 0),
    );

    return {
        totalQty: products.reduce((total, product) => total + product.qty, 0),
        invoiceTotal,
    };
};

export const createBillingService = async (
    data: BillingInput,
    createdBy?: mongoose.Types.ObjectId,
) => {
    const customer = await validateCustomer(data.customer);
    const date = parseDate(data.date);
    const products = await prepareProducts(data.products);
    const totals = computeTotals(products);

    await deductStock(toStockLines(products));

    try {
        return await createBilling({
            invoiceNo: await generateInvoiceNo(),
            customer,
            date,
            products,
            ...totals,
            returnAmount: 0,
            netAmount: totals.invoiceTotal,
            receivedAmount: 0,
            balanceAmount: totals.invoiceTotal,
            createdBy,
        });
    } catch (error) {
        await restoreStock(toStockLines(products));
        throw error;
    }
};

export const getAllBillingsService = async (
    page: number,
    limit: number,
    search?: string,
    customer?: string,
) => {
    if (!Number.isInteger(page) || page < 1) {
        throw new Error("PAGINATION_INVALID");
    }

    if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("PAGINATION_INVALID");
    }

    if (customer && !isValidObjectId(customer)) {
        throw new Error("CUSTOMER_ID_INVALID");
    }

    return findAllBillings(page, Math.min(limit, 100), search, customer);
};

export const getBillingByIdService = async (id: string) => {
    if (!isValidObjectId(id)) {
        throw new Error("BILLING_ID_INVALID");
    }

    const billing = await findBillingById(id);

    if (!billing) {
        throw new Error("BILLING_NOT_FOUND");
    }

    return billing;
};

/**
 * Date and customer can always change. Products can only change while the
 * invoice has no receipts or returns; stock is restored and re-deducted.
 */
export const updateBillingService = async (
    id: string,
    data: Partial<BillingInput>,
    updatedBy?: mongoose.Types.ObjectId,
) => {
    if (!isValidObjectId(id)) {
        throw new Error("BILLING_ID_INVALID");
    }

    const existing = await BillingModel.findOne({ _id: id, isDeleted: false });

    if (!existing) {
        throw new Error("BILLING_NOT_FOUND");
    }

    const updates: Record<string, unknown> = {
        updatedBy,
        userUpdatedDate: new Date(),
    };

    if (data.customer !== undefined) {
        updates.customer = await validateCustomer(data.customer);
    }

    if (data.date !== undefined) {
        updates.date = parseDate(data.date);
    }

    if (data.products !== undefined) {
        if (await hasReceiptsOrReturns(existing._id)) {
            throw new Error("BILLING_HAS_RECEIPTS_OR_RETURNS");
        }

        const oldLines = toStockLines(existing.products);

        await restoreStock(oldLines);

        let products: BillingProduct[];

        try {
            products = await prepareProducts(data.products);
            await deductStock(toStockLines(products));
        } catch (error) {
            await deductStock(oldLines);
            throw error;
        }

        const totals = computeTotals(products);

        Object.assign(updates, {
            products,
            ...totals,
            returnAmount: 0,
            netAmount: totals.invoiceTotal,
            receivedAmount: 0,
            balanceAmount: totals.invoiceTotal,
        });
    }

    const updatedBilling = await updateBillingById(id, updates);

    if (!updatedBilling) {
        throw new Error("BILLING_NOT_FOUND");
    }

    return updatedBilling;
};

export const deleteBillingService = async (
    id: string,
    deletedBy?: mongoose.Types.ObjectId,
) => {
    if (!isValidObjectId(id)) {
        throw new Error("BILLING_ID_INVALID");
    }

    const existing = await BillingModel.findOne({ _id: id, isDeleted: false });

    if (!existing) {
        throw new Error("BILLING_NOT_FOUND");
    }

    if (await hasReceiptsOrReturns(existing._id)) {
        throw new Error("BILLING_HAS_RECEIPTS_OR_RETURNS");
    }

    const billing = await softDeleteBillingById(id, deletedBy);

    if (!billing) {
        throw new Error("BILLING_NOT_FOUND");
    }

    // Billed qty goes back to UAE_MAIN STORE
    await restoreStock(toStockLines(existing.products));

    return billing;
};
interface UpdateBillingPaymentInput {
    paidAmount: number;
    paidStatus: "Fully Paid" | "Partial Paid";

}

export const updateBillingPaymentStatusService = async (
    billingId: string,
    paymentData: UpdateBillingPaymentInput,
) => {
    if (!mongoose.Types.ObjectId.isValid(billingId)) {
        throw new Error("BILLING_ID_INVALID");
    }

    const enteredAmount = Number(paymentData.paidAmount);

    if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
        throw new Error("PAYMENT_AMOUNT_INVALID");
    }

    const billing = await findBillingById(billingId);

    if (!billing) {
        throw new Error("BILLING_NOT_FOUND");
    }

    const currentBalance = Number(billing.balanceAmount ?? 0);
    const currentPaidAmount = Number(billing.paidAmount ?? 0);

    if (enteredAmount > currentBalance) {
        throw new Error("PAYMENT_AMOUNT_EXCEEDS_BALANCE");
    }

    const round2 = (value: number) =>
        Math.round((value + Number.EPSILON) * 100) / 100;

    const newPaidAmount = round2(currentPaidAmount + enteredAmount);
    const newBalanceAmount = round2(currentBalance - enteredAmount);

    const expectedStatus =
        newBalanceAmount === 0 ? "Fully Paid" : "Partial Paid";

    if (paymentData.paidStatus !== expectedStatus) {
        throw new Error("BILLING_PAYMENT_STATUS_INVALID");
    }

    const isPaid = expectedStatus === "Fully Paid";

    const updatedBilling = await updateBillingPaymentStatus(
        billingId,
        currentBalance,
        newPaidAmount,
        newBalanceAmount,
        isPaid,
    );

    if (!updatedBilling) {
        throw new Error("BILLING_BALANCE_CHANGED");
    }

    return updatedBilling;
};