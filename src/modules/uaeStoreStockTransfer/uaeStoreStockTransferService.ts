import mongoose from "mongoose";
import * as uaeStoreStockTransferRepo from "./uaeStoreStockTransferRepository";
import BillingModel from "../../models/billingModel";
import UAEMainStockModel from "../../models/uaeMainStockModel";
import UAEStoreStockTransferModel from "../../models/uaeStoreStockTransferModel";
import { refreshBillingTotals } from "../billing/billingService";
import {
    getPaginationParams,
    getPaginationMeta,
} from "../../utils/pagination";
import { paginatedResponse } from "../../utils/response";
import { round2 } from "../../utils/errorStatus";

type UAESort = "date" | "style" | "product";

const RETURN_REASONS = ["Damage", "Size issue", "Other"];

const toSort = (sortBy?: string): UAESort =>
    sortBy === "style" || sortBy === "product" ? sortBy : "date";

const matches = (search: string | undefined, ...values: string[]) => {
    const query = search?.trim().toLowerCase();

    return !query || values.some((value) => value.toLowerCase().includes(query));
};

const sortRows = <T extends { styleNo: string; productName: string }>(
    rows: T[],
    sortBy: UAESort,
    getDate: (row: T) => Date,
) =>
    [...rows].sort((a, b) => {
        if (sortBy === "style") return a.styleNo.localeCompare(b.styleNo);
        if (sortBy === "product") return a.productName.localeCompare(b.productName);
        return new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime();
    });

/** UAE_MAIN STORE stock rows with stock volume and value (at cost). */
export const getUAEMainStockService = async (
    search?: string,
    sortBy?: string,
) => {
    const stock = (await uaeStoreStockTransferRepo.findUAEMainStock()).filter(
        (row: any) => matches(search, row.styleNo, row.productName),
    );

    const data = sortRows(stock as any[], toSort(sortBy), (row) => row.transitDate);

    return {
        summary: {
            stockVolume: data.reduce((total, row) => total + row.qty, 0),
            stockValue: round2(
                data.reduce((total, row) => total + row.qty * row.costAED, 0),
            ),
        },
        data,
    };
};

/** Qty already returned per billing product of an invoice. */
const getReturnedQtyByBillingProduct = async (invoiceId: mongoose.Types.ObjectId) => {
    const returns = await UAEStoreStockTransferModel.find({
        invoice: invoiceId,
        isDeleted: false,
    })
        .select("products.billingProduct products.returnedQty")
        .lean();

    const returned = new Map<string, number>();

    for (const record of returns as any[]) {
        for (const product of record.products) {
            const key = product.billingProduct.toString();
            returned.set(key, (returned.get(key) ?? 0) + product.returnedQty);
        }
    }

    return returned;
};

const getInvoice = async (invoiceId: unknown) => {
    if (
        typeof invoiceId !== "string" ||
        !mongoose.Types.ObjectId.isValid(invoiceId)
    ) {
        throw new Error("BILLING_INVOICE_ID_INVALID");
    }

    const invoice = await BillingModel.findOne({
        _id: invoiceId,
        isDeleted: false,
    });

    if (!invoice) {
        throw new Error("BILLING_INVOICE_NOT_FOUND");
    }

    return invoice;
};

interface ReturnableLine {
    billingProduct: mongoose.Types.ObjectId;
    uaeMainStock: mongoose.Types.ObjectId;
    styleNo: string;
    productName: string;
    invoicedQty: number;
    returnedQty: number;
    returnableQty: number;
    unitPrice: number;
}

/** Lines of an invoice with how much can still be returned. */
export const getReturnableProductsService = async (invoiceId: string) => {
    const invoice = await getInvoice(invoiceId);
    const returned = await getReturnedQtyByBillingProduct(invoice._id);

    return {
        invoice: {
            _id: invoice._id,
            invoiceNo: invoice.invoiceNo,
            date: invoice.date,
            customer: invoice.customer,
        },
        products: (invoice.products as any[]).map((product): ReturnableLine => {
            const returnedQty = returned.get(product._id.toString()) ?? 0;

            return {
                billingProduct: product._id,
                uaeMainStock: product.uaeMainStock,
                styleNo: product.styleNo,
                productName: product.productName,
                invoicedQty: product.qty,
                returnedQty,
                returnableQty: Math.max(0, product.qty - returnedQty),
                unitPrice: product.unitPrice,
            };
        }),
    };
};

const generateReturnNo = async () => {
    const latest = await uaeStoreStockTransferRepo.findLatestReturnNo();
    const lastNumber = latest ? Number(latest.replace("RET-", "")) : 0;

    return `RET-${String(lastNumber + 1).padStart(4, "0")}`;
};

interface CreateReturnInput {
    invoice: string;
    returnType: string;
    reason: string;
    returnDate?: string | Date;
    products?: { billingProduct: string; qty: number }[];
    fromStore?: string;
    toStore?: string;
}

/**
 * Books a customer return into UAE_RETURN STORE.
 * Fully   - every line is returned with its full returnable qty.
 * Partial - only the given lines / qty (each <= returnable qty).
 * The invoice's return amount, net amount and balance are updated.
 */
export const createUAEStoreStockTransferService = async (
    data: CreateReturnInput,
    createdBy?: mongoose.Types.ObjectId,
) => {
    const returnType =
        data.returnType === "Partially" ? "Partial" : data.returnType;

    if (returnType !== "Fully" && returnType !== "Partial") {
        throw new Error("RETURN_TYPE_INVALID");
    }

    if (!RETURN_REASONS.includes(data.reason)) {
        throw new Error("RETURN_REASON_INVALID");
    }

    const returnDate = data.returnDate ? new Date(data.returnDate) : new Date();

    if (Number.isNaN(returnDate.getTime())) {
        throw new Error("RETURN_DATE_INVALID");
    }

    for (const store of [data.fromStore, data.toStore]) {
        if (store !== undefined && !mongoose.Types.ObjectId.isValid(store)) {
            throw new Error("STORE_ID_INVALID");
        }
    }

    const { invoice, products: returnable } =
        await getReturnableProductsService(data.invoice);

    let picks: { line: ReturnableLine; qty: number }[];

    if (returnType === "Fully") {
        picks = returnable
            .filter((line) => line.returnableQty > 0)
            .map((line) => ({ line, qty: line.returnableQty }));
    } else {
        if (!Array.isArray(data.products) || data.products.length === 0) {
            throw new Error("RETURN_PRODUCTS_REQUIRED");
        }

        const seen = new Set<string>();

        picks = data.products
            .filter((product) => Number(product?.qty) > 0)
            .map((product) => {
                const key = String(product.billingProduct);

                if (seen.has(key)) {
                    throw new Error("DUPLICATE_RETURN_PRODUCT");
                }

                seen.add(key);

                const line = returnable.find(
                    (row) => row.billingProduct.toString() === key,
                );

                if (!line) {
                    throw new Error("RETURN_PRODUCT_NOT_FOUND");
                }

                if (!Number.isInteger(product.qty) || product.qty > line.returnableQty) {
                    throw new Error("RETURN_QTY_EXCEEDS_RETURNABLE");
                }

                return { line, qty: product.qty };
            });
    }

    if (picks.length === 0) {
        throw new Error("RETURN_PRODUCTS_REQUIRED");
    }

    const stockRows = await UAEMainStockModel.find({
        _id: { $in: picks.map((pick) => pick.line.uaeMainStock) },
    })
        .select("costAED")
        .lean<{ _id: mongoose.Types.ObjectId; costAED: number }[]>();

    const costById = new Map(
        stockRows.map((row) => [row._id.toString(), row.costAED]),
    );

    const record = await uaeStoreStockTransferRepo.createUAEStoreStockTransfer({
        returnNo: await generateReturnNo(),
        invoice: invoice._id,
        invoiceNo: invoice.invoiceNo,
        returnType,
        reason: data.reason,
        returnDate,
        fromStore: data.fromStore,
        toStore: data.toStore,
        products: picks.map(({ line, qty }) => ({
            billingProduct: line.billingProduct,
            uaeMainStock: line.uaeMainStock,
            styleNo: line.styleNo,
            productName: line.productName,
            returnedQty: qty,
            unitPrice: line.unitPrice,
            costAED: costById.get(line.uaeMainStock.toString()) ?? 0,
            returnValue: round2(qty * line.unitPrice),
            inStore: qty,
        })),
        createdBy,
    });

    await refreshBillingTotals(invoice._id);

    return record;
};

/** UAE_RETURN STORE rows (one per returned style). */
export const getReturnStoreStockService = async (
    search?: string,
    sortBy?: string,
) => {
    const returns = await uaeStoreStockTransferRepo.findActiveReturns();

    const rows = (returns as any[]).flatMap((record) =>
        record.products.map((product: any) => ({
            _id: product._id,
            returnId: record._id,
            returnNo: record.returnNo,
            invoice: record.invoice?._id ?? record.invoice,
            invoiceNo: record.invoiceNo,
            styleNo: product.styleNo,
            productName: product.productName,
            returnedQty: product.returnedQty,
            reason: record.reason,
            returnType: record.returnType,
            unitPrice: product.unitPrice,
            invoiceValue: record.invoice?.invoiceTotal ?? 0,
            updatedInvoiceValue: record.invoice?.netAmount ?? 0,
            inStore: product.inStore,
            returnDate: record.returnDate,
        })),
    );

    const data = sortRows(
        rows.filter((row) => matches(search, row.styleNo, row.productName)),
        toSort(sortBy),
        (row) => row.returnDate,
    );

    return {
        summary: {
            stockVolume: data.reduce((total, row) => total + row.inStore, 0),
            stockValue: round2(
                data.reduce((total, row) => total + row.inStore * row.unitPrice, 0),
            ),
        },
        data,
    };
};

/** Moves non-damaged returned stock back to UAE_MAIN STORE. */
export const moveReturnToMainStoreService = async (
    data: { returnId: string; returnProduct: string; qty: number },
    updatedBy?: mongoose.Types.ObjectId,
) => {
    if (
        !mongoose.Types.ObjectId.isValid(data.returnId) ||
        !mongoose.Types.ObjectId.isValid(data.returnProduct)
    ) {
        throw new Error("UAE_RETURN_ID_INVALID");
    }

    const record = await UAEStoreStockTransferModel.findOne({
        _id: data.returnId,
        isDeleted: false,
    });

    if (!record) {
        throw new Error("UAE_RETURN_NOT_FOUND");
    }

    if (record.reason === "Damage") {
        throw new Error("DAMAGED_RETURN_CANNOT_MOVE");
    }

    const product = record.products.id(data.returnProduct);

    if (!product) {
        throw new Error("RETURN_PRODUCT_NOT_FOUND");
    }

    if (!Number.isInteger(data.qty) || data.qty <= 0 || data.qty > product.inStore) {
        throw new Error("RETURN_MOVE_QTY_INVALID");
    }

    product.inStore -= data.qty;
    record.updatedBy = updatedBy;
    record.userUpdatedDate = new Date();
    await record.save();

    const mainStock = await UAEMainStockModel.findOneAndUpdate(
        { styleNo: product.styleNo, isDeleted: false },
        { $inc: { qty: data.qty }, $set: { updatedBy } },
        { new: true },
    );

    if (mainStock) return mainStock;

    return UAEMainStockModel.create({
        styleNo: product.styleNo,
        productName: product.productName,
        qty: data.qty,
        costAED: product.costAED,
        sellingPriceAED: product.unitPrice,
        transitDate: new Date(),
        createdBy: updatedBy,
    });
};

export const getAllUAEStoreStockTransfersService = async (
    query: { page?: unknown; limit?: unknown },
    invoice?: string,
) => {
    const { page, limit } = getPaginationParams(query);

    if (invoice && !mongoose.Types.ObjectId.isValid(invoice)) {
        throw new Error("BILLING_INVOICE_ID_INVALID");
    }

    const { data, totalRecords } =
        await uaeStoreStockTransferRepo.findAllUAEStoreStockTransfers(
            page,
            limit,
            invoice,
        );

    return paginatedResponse(
        data,
        getPaginationMeta(page, limit, totalRecords),
    );
};

export const getUAEStoreStockTransferByIdService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("UAE_RETURN_ID_INVALID");
    }

    const transfer =
        await uaeStoreStockTransferRepo.findUAEStoreStockTransferById(id);

    if (!transfer) {
        throw new Error("UAE_RETURN_NOT_FOUND");
    }

    return transfer;
};

/** A return can only be cancelled while none of it was moved back to main. */
export const deleteUAEStoreStockTransferService = async (
    id: string,
    deletedBy?: mongoose.Types.ObjectId,
) => {
    const existing = await getUAEStoreStockTransferByIdService(id);

    if (
        existing.products.some(
            (product: any) => product.inStore !== product.returnedQty,
        )
    ) {
        throw new Error("UAE_RETURN_ALREADY_MOVED");
    }

    const deleted =
        await uaeStoreStockTransferRepo.softDeleteUAEStoreStockTransferById(
            id,
            deletedBy,
        );

    if (!deleted) {
        throw new Error("UAE_RETURN_NOT_FOUND");
    }

    await refreshBillingTotals(deleted.invoice);

    return deleted;
};
