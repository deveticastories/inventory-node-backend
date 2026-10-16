
import mongoose from "mongoose";
import VendorModel from "../../models/vendorModel";
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
        totalIncludingGST: input.totalIncludingGST,
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
        updateData.totalIncludingGST = input.totalIncludingGST;
    }

    if (input.qcStatus !== undefined) {
        updateData.qcStatus = input.qcStatus;
    }

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

    const deletedEntry = await deletePurchaseEntryById(id, deletedBy);

    if (!deletedEntry) {
        throw new Error("PURCHASE_NOT_FOUND");
    }

    return deletedEntry;
};
