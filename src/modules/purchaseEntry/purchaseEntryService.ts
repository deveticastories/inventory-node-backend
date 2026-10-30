
import mongoose from "mongoose";
import VendorModel from "../../models/vendorModel";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import {
    createPurchaseEntry,
    findPurchaseEntryById,
    getAllPurchaseEntries,
    updatePurchaseEntryById,
    deletePurchaseEntryById,
    countPurchaseEntries,
    purchaseInvoiceExists,
} from "./purchaseEntryRepository";
import { CreatePurchaseEntryInput, UpdatePurchaseEntryInput } from "../../validation/purchaseEntryValidation";



const calculateTotals = (
    products: CreatePurchaseEntryInput["products"],
) => {
    const calculatedProducts = products.map((product) => ({
        productName: product.productName.trim(),
        purchaseQty: product.purchaseQty,
        purchaseRate: product.purchaseRate,
        amount: product.purchaseQty * product.purchaseRate,
    }));

    return {
        products: calculatedProducts,
        totalProductQty: calculatedProducts.reduce(
            (total, product) => total + product.purchaseQty,
            0,
        ),
        totalAmount: calculatedProducts.reduce(
            (total, product) => total + product.amount,
            0,
        ),
    };
};

const generateInvoiceNo = async (): Promise<string> => {
    const count = await countPurchaseEntries();
    let invoiceNo = `PUR-${String(count + 1).padStart(4, "0")}`;

    while (await purchaseInvoiceExists(invoiceNo)) {
        const nextCount = await countPurchaseEntries();
        invoiceNo = `PUR-${String(nextCount + 1).padStart(4, "0")}`;
    }

    return invoiceNo;
};

export const createPurchaseEntryService = async (
    input: CreatePurchaseEntryInput,
    createdBy: mongoose.Types.ObjectId,
) => {
    const vendorExists = await VendorModel.exists({
        _id: input.vendor,
        isDeleted: false,
    });

    if (!vendorExists) {
        throw new Error("PURCHASE_VENDOR_NOT_FOUND");
    }

    const invoiceNo = await generateInvoiceNo();
    const totals = calculateTotals(input.products);

    return createPurchaseEntry({
        invoiceNo,
        purchaseDate: input.purchaseDate,
        vendor: new mongoose.Types.ObjectId(input.vendor),
        ...totals,
        // Blank "Total including GST" falls back to the product total
        totalIncludingGST: input.totalIncludingGST || totals.totalAmount,
        qcStatus: "Pending",
        createdBy,
    });
};

export const getAllPurchaseEntriesService = async (
    page: number,
    limit: number,
) => {
    return getAllPurchaseEntries(page, limit);
};

export const getPurchaseEntryByIdService = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PURCHASE_ID_INVALID");
    }

    const purchaseEntry = await findPurchaseEntryById(id);

    if (!purchaseEntry) {
        throw new Error("PURCHASE_NOT_FOUND");
    }

    return purchaseEntry;
};

export const updatePurchaseEntryService = async (
    id: string,
    input: UpdatePurchaseEntryInput,
    updatedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PURCHASE_ID_INVALID");
    }

    const existingEntry = await findPurchaseEntryById(id);

    if (!existingEntry) {
        throw new Error("PURCHASE_NOT_FOUND");
    }

    if (existingEntry.qcStatus === "Done") {
        throw new Error("PURCHASE_QC_ALREADY_DONE");
    }

    const updateData: Record<string, unknown> = {
        updatedBy,
        userUpdatedDate: new Date(),
    };

    if (input.purchaseDate !== undefined) {
        updateData.purchaseDate = input.purchaseDate;
    }

    if (input.vendor !== undefined) {
        const vendorExists = await VendorModel.exists({
            _id: input.vendor,
            isDeleted: false,
        });

        if (!vendorExists) {
            throw new Error("PURCHASE_VENDOR_NOT_FOUND");
        }

        updateData.vendor = new mongoose.Types.ObjectId(input.vendor);
    }

    if (input.products !== undefined) {
        Object.assign(updateData, calculateTotals(input.products));
    }

    if (input.totalIncludingGST !== undefined) {
        updateData.totalIncludingGST =
            input.totalIncludingGST ||
            (updateData.totalAmount ?? existingEntry.totalAmount);
    }

    // qcStatus is only changed by submitting a quality check

    const updatedEntry = await updatePurchaseEntryById(id, updateData);

    if (!updatedEntry) {
        throw new Error("PURCHASE_NOT_FOUND");
    }

    return updatedEntry;
};

export const updatePurchaseEntryQCService = async (
    id: string,
    qcStatus: "Pending" | "Done",
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PURCHASE_ID_INVALID");
    }

    const existingEntry = await findPurchaseEntryById(id);

    if (!existingEntry) {
        throw new Error("PURCHASE_NOT_FOUND");
    }

    // "Done" is only valid once a quality check has been recorded, and a
    // completed QC cannot be re-opened (stock and payable depend on it).
    const qualityCheck = await PurchaseQualityCheckModel.exists({
        purchaseEntry: existingEntry._id,
        isDeleted: false,
    });

    if (qcStatus === "Done" && !qualityCheck) {
        throw new Error("PURCHASE_QC_RECORD_REQUIRED");
    }

    if (qcStatus === "Pending" && qualityCheck) {
        throw new Error("PURCHASE_QC_ALREADY_DONE");
    }

    const updatedEntry = await updatePurchaseEntryById(id, {
        qcStatus,
    });

    if (!updatedEntry) {
        throw new Error("PURCHASE_NOT_FOUND");
    }

    return updatedEntry;
};

export const deletePurchaseEntryService = async (
    id: string,
    deletedBy: mongoose.Types.ObjectId,
) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error("PURCHASE_ID_INVALID");
    }

    const existingEntry = await findPurchaseEntryById(id);

    if (!existingEntry) {
        throw new Error("PURCHASE_NOT_FOUND");
    }

    if (existingEntry.qcStatus === "Done") {
        throw new Error("PURCHASE_QC_ALREADY_DONE");
    }

    const deletedEntry = await deletePurchaseEntryById(id, deletedBy);

    if (!deletedEntry) {
        throw new Error("PURCHASE_NOT_FOUND");
    }

    return deletedEntry;
};
