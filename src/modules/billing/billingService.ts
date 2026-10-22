
import mongoose from "mongoose";
import type { Billing, BillingProduct } from "../../models/billingModel";
import {
    createBilling,
    findAllBillings,
    findBillingById,
    updateBillingById,
    softDeleteBillingById,generateInvoiceNo
} from "./billingRepository";

type BillingInput = {
    date?: string | Date;
    customer: string;
    products: Array<{
        uaeStoreStockTransfer: string;
        packingStyle: string;
        styleNo: string;
        productName: string;
        qty: number;
        unitPrice: number;
    }>;
    returnAmount?: number;
    receivedAmount?: number;
};

const isValidObjectId = (value: unknown): value is string =>
    typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const validateNonNegativeAmount = (value: number, field: string) => {
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${field}_INVALID`);
    }
};

const prepareBillingData = (data: BillingInput) => {
    if (!isValidObjectId(data.customer)) {
        throw new Error("CUSTOMER_ID_INVALID");
    }

    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error("BILLING_PRODUCTS_REQUIRED");
    }

    const products: BillingProduct[] = data.products.map((product) => {
        if (!isValidObjectId(product.uaeStoreStockTransfer)) {
            throw new Error("UAE_STORE_STOCK_TRANSFER_ID_INVALID");
        }

        if (!isValidObjectId(product.packingStyle)) {
            throw new Error("PACKING_STYLE_ID_INVALID");
        }

        if (
            !Number.isInteger(product.qty) ||
            product.qty < 1
        ) {
            throw new Error("BILLING_QTY_INVALID");
        }

        if (
            typeof product.styleNo !== "string" ||
            !product.styleNo.trim()
        ) {
            throw new Error("BILLING_STYLE_NO_REQUIRED");
        }

        if (
            typeof product.productName !== "string" ||
            !product.productName.trim()
        ) {
            throw new Error("BILLING_PRODUCT_NAME_REQUIRED");
        }

        validateNonNegativeAmount(product.unitPrice, "UNIT_PRICE");

        const amount = Number(
            (product.qty * product.unitPrice).toFixed(2),
        );

        return {
            uaeStoreStockTransfer: new mongoose.Types.ObjectId(
                product.uaeStoreStockTransfer,
            ),
            packingStyle: new mongoose.Types.ObjectId(product.packingStyle),
            styleNo: product.styleNo.trim(),
            productName: product.productName.trim(),
            qty: product.qty,
            unitPrice: product.unitPrice,
            amount,
        };
    });

    const totalQty = products.reduce(
        (total, product) => total + product.qty,
        0,
    );

    const invoiceTotal = Number(
        products
            .reduce((total, product) => total + product.amount, 0)
            .toFixed(2),
    );

    const returnAmount = data.returnAmount ?? 0;
    const receivedAmount = data.receivedAmount ?? 0;

    validateNonNegativeAmount(returnAmount, "RETURN_AMOUNT");
    validateNonNegativeAmount(receivedAmount, "RECEIVED_AMOUNT");

    if (returnAmount > invoiceTotal) {
        throw new Error("RETURN_AMOUNT_EXCEEDS_INVOICE_TOTAL");
    }

    const netAmount = Number((invoiceTotal - returnAmount).toFixed(2));

    if (receivedAmount > netAmount) {
        throw new Error("RECEIVED_AMOUNT_EXCEEDS_NET_AMOUNT");
    }

    const balanceAmount = Number(
        (netAmount - receivedAmount).toFixed(2),
    );

    const date = data.date ? new Date(data.date) : new Date();

    if (Number.isNaN(date.getTime())) {
        throw new Error("BILLING_DATE_INVALID");
    }

    return {
        customer: new mongoose.Types.ObjectId(data.customer),
        date,
        products,
        totalQty,
        invoiceTotal,
        returnAmount,
        netAmount,
        receivedAmount,
        balanceAmount,
    };
};


export const createBillingService = async (data: BillingInput) => {
    const billingData = prepareBillingData(data);
    const invoiceNo = await generateInvoiceNo();

    return createBilling({
        ...billingData,
        invoiceNo,
    });
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

export const updateBillingService = async (
    id: string,
    data: Partial<BillingInput>,
) => {
    if (!isValidObjectId(id)) {
        throw new Error("BILLING_ID_INVALID");
    }

    const existingBilling = await findBillingById(id);

    if (!existingBilling) {
        throw new Error("BILLING_NOT_FOUND");
    }

    const mergedData: BillingInput = {
        customer:
            data.customer ?? String(existingBilling.customer?._id ?? existingBilling.customer),
        date: data.date ?? existingBilling.date,
        products:
            data.products ??
            existingBilling.products.map((product: { uaeStoreStockTransfer: any; packingStyle: any; styleNo: any; productName: any; qty: any; unitPrice: any; }) => ({
                uaeStoreStockTransfer: String(product.uaeStoreStockTransfer),
                packingStyle: String(product.packingStyle),
                styleNo: product.styleNo,
                productName: product.productName,
                qty: product.qty,
                unitPrice: product.unitPrice,
            })),
        returnAmount: data.returnAmount ?? existingBilling.returnAmount,
        receivedAmount:
            data.receivedAmount ?? existingBilling.receivedAmount,
    };

    const billingData = prepareBillingData(mergedData);

    const updatedBilling = await updateBillingById(id, billingData);

    if (!updatedBilling) {
        throw new Error("BILLING_NOT_FOUND");
    }

    return updatedBilling;
};

export const deleteBillingService = async (id: string) => {
    if (!isValidObjectId(id)) {
        throw new Error("BILLING_ID_INVALID");
    }

    const billing = await softDeleteBillingById(id);

    if (!billing) {
        throw new Error("BILLING_NOT_FOUND");
    }

    return billing;
};
