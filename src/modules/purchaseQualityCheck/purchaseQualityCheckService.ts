import mongoose from "mongoose";
import * as purchaseQualityCheckRepo from "./purchaseQualityCheckRepository";
import { message } from "../../constants/responseMessage";

interface QualityCheckProductInput {
    purchaseEntryProduct: string;
    damageQty: number;
}

interface QualityCheckInput {
    purchaseEntry: string;
    products: QualityCheckProductInput[];
}

interface PurchaseProduct {
    _id: mongoose.Types.ObjectId;
    productName: string;
    purchaseQty: number;
    purchaseRate: number;
}

const getErrorMessage = (key: string, fallback: string) => {
    return (message as Record<string, string>)[key] ?? fallback;
};

export const createOrUpdateQualityCheckService = async (
    data: QualityCheckInput,
    checkedBy: string,
) => {
    if (!mongoose.Types.ObjectId.isValid(data.purchaseEntry)) {
        throw new Error(
            getErrorMessage(
                "INVALID_PURCHASE_ENTRY_ID",
                "Invalid purchase entry ID",
            ),
        );
    }

    if (!mongoose.Types.ObjectId.isValid(checkedBy)) {
        throw new Error("Invalid user ID");
    }

    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error("At least one product is required");
    }

    const purchaseEntry =
        await purchaseQualityCheckRepo.findPurchaseEntryById(
            data.purchaseEntry,
        );

    if (!purchaseEntry) {
        throw new Error(
            getErrorMessage(
                "PURCHASE_ENTRY_NOT_FOUND",
                "Purchase entry not found",
            ),
        );
    }

    const purchaseProducts =
        purchaseEntry.products as unknown as PurchaseProduct[];

    if (data.products.length !== purchaseProducts.length) {
        throw new Error(
            "A damage quantity must be provided for every purchase product",
        );
    }

    const purchaseProductsById = new Map(
        purchaseProducts.map((product) => [
            product._id.toString(),
            product,
        ]),
    );

    const submittedProductIds = new Set<string>();

    const products = data.products.map((inputProduct) => {
        if (
            !mongoose.Types.ObjectId.isValid(
                inputProduct.purchaseEntryProduct,
            )
        ) {
            throw new Error("Invalid purchase product ID");
        }

        const productId = inputProduct.purchaseEntryProduct;

        if (submittedProductIds.has(productId)) {
            throw new Error("Duplicate purchase product ID");
        }

        submittedProductIds.add(productId);

        const purchaseProduct = purchaseProductsById.get(productId);

        if (!purchaseProduct) {
            throw new Error(
                "Product does not belong to the selected purchase entry",
            );
        }

        const damageQty = inputProduct.damageQty;

        if (
            typeof damageQty !== "number" ||
            !Number.isInteger(damageQty) ||
            damageQty < 0 ||
            damageQty > purchaseProduct.purchaseQty
        ) {
            throw new Error(
                `Invalid damage quantity for ${purchaseProduct.productName}`,
            );
        }

        const approvedQty = purchaseProduct.purchaseQty - damageQty;
        const payableAfterQC =
            approvedQty * purchaseProduct.purchaseRate;

        return {
            purchaseEntryProduct: purchaseProduct._id,
            productName: purchaseProduct.productName,
            totalQty: purchaseProduct.purchaseQty,
            purchaseRate: purchaseProduct.purchaseRate,
            damageQty,
            approvedQty,
            availableQtyAfterQC: approvedQty,
            payableAfterQC,
        };
    });

    if (submittedProductIds.size !== purchaseProducts.length) {
        throw new Error(
            "A damage quantity must be provided for every purchase product",
        );
    }

    const totalApprovedQty = products.reduce(
        (total, product) => total + product.approvedQty,
        0,
    );

    const totalDamagedQty = products.reduce(
        (total, product) => total + product.damageQty,
        0,
    );

    const availableQtyAfterQC = products.reduce(
        (total, product) => total + product.availableQtyAfterQC,
        0,
    );

    const payableAfterQC = products.reduce(
        (total, product) => total + product.payableAfterQC,
        0,
    );

    const qualityCheckData = {
        purchaseEntry: purchaseEntry._id,
        products,
        totalApprovedQty,
        totalDamagedQty,
        availableQtyAfterQC,
        payableAfterQC,
        checkedBy: new mongoose.Types.ObjectId(checkedBy),
    };

    const existingQC =
        await purchaseQualityCheckRepo.findQualityCheckByPurchaseEntry(
            purchaseEntry._id,
        );

    if (existingQC) {
        if (purchaseEntry.qcStatus === "Done") {
            throw new Error("Quality check has already been completed");
        }

        return purchaseQualityCheckRepo.updateQualityCheck(
            purchaseEntry._id,
            qualityCheckData,
        );
    }

    const qualityCheck =
        await purchaseQualityCheckRepo.createQualityCheck(
            qualityCheckData,
        );

    await purchaseQualityCheckRepo.updatePurchaseEntryQCStatus(
        data.purchaseEntry,
    );

    return qualityCheck;
};

const formatQualityCheck = (qualityCheck: any) => {
    const purchaseEntry = qualityCheck.purchaseEntry;

    const approvedProducts = qualityCheck.products
        .filter((product: any) => product.approvedQty > 0)
        .map((product: any) => ({
            purchaseEntryProduct: product.purchaseEntryProduct,
            productName: product.productName,
            qty: product.approvedQty,
            rate: product.purchaseRate,
            amount: product.payableAfterQC,
        }));

    const damagedProducts = qualityCheck.products
        .filter((product: any) => product.damageQty > 0)
        .map((product: any) => ({
            purchaseEntryProduct: product.purchaseEntryProduct,
            productName: product.productName,
            qty: product.damageQty,
            rate: product.purchaseRate,
            amount: product.damageQty * product.purchaseRate,
        }));

    return {
        _id: qualityCheck._id,
        purchaseEntry: {
            _id: purchaseEntry?._id,
            invoiceNo: purchaseEntry?.invoiceNo,
            purchaseDate: purchaseEntry?.purchaseDate,
            vendor: purchaseEntry?.vendor,
        },
        summary: {
            totalApprovedQty: qualityCheck.totalApprovedQty,
            availableQtyAfterQC: qualityCheck.availableQtyAfterQC,
            damagedQty: qualityCheck.totalDamagedQty,
            payableAfterQC: qualityCheck.payableAfterQC,
        },
        approvedProducts,
        damagedProducts,
    };
};

export const getQualityCheckByIdService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(
            getErrorMessage(
                "INVALID_QUALITY_CHECK_ID",
                "Invalid quality check ID",
            ),
        );
    }

    const qualityCheck =
        await purchaseQualityCheckRepo.findQualityCheckById(id);

    if (!qualityCheck) {
        throw new Error(
            getErrorMessage(
                "PURCHASE_QUALITY_CHECK_NOT_FOUND",
                "Purchase quality check not found",
            ),
        );
    }

    return formatQualityCheck(qualityCheck);
};

export const getQualityCheckByPurchaseEntryService = async (
    purchaseEntryId: string,
) => {
    if (!mongoose.Types.ObjectId.isValid(purchaseEntryId)) {
        throw new Error(
            getErrorMessage(
                "INVALID_PURCHASE_ENTRY_ID",
                "Invalid purchase entry ID",
            ),
        );
    }

    const qualityCheck =
        await purchaseQualityCheckRepo.findQualityCheckByPurchaseEntry(
            new mongoose.Types.ObjectId(purchaseEntryId),
        );

    if (!qualityCheck) {
        throw new Error(
            getErrorMessage(
                "PURCHASE_QUALITY_CHECK_NOT_FOUND",
                "Purchase quality check not found",
            ),
        );
    }

    const populatedQualityCheck =
        await purchaseQualityCheckRepo.findQualityCheckById(
            qualityCheck._id.toString(),
        );

    if (!populatedQualityCheck) {
        throw new Error(
            getErrorMessage(
                "PURCHASE_QUALITY_CHECK_NOT_FOUND",
                "Purchase quality check not found",
            ),
        );
    }

    return formatQualityCheck(populatedQualityCheck);
};

export const getAllQualityChecksService = async () => {
    const qualityChecks =
        await purchaseQualityCheckRepo.findAllQualityChecks();

    return qualityChecks.map(formatQualityCheck);
};