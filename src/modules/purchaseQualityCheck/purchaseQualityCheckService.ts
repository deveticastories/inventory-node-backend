
import mongoose from "mongoose";
import * as purchaseQualityCheckRepo from "./purchaseQualityCheckRepository";
import { message } from "../../constants/responseMessage";

interface QualityCheckInput {
    purchaseEntry: string;
    products: {
        damageQty: number;
    }[];
}

export const createOrUpdateQualityCheckService = async (
    data: QualityCheckInput,
    checkedBy: string,
) => {
    if (!mongoose.Types.ObjectId.isValid(data.purchaseEntry)) {
        throw new Error("Invalid purchase entry ID");
    }

    if (!mongoose.Types.ObjectId.isValid(checkedBy)) {
        throw new Error("Invalid user ID");
    }

    const purchaseEntry =
        await purchaseQualityCheckRepo.findPurchaseEntryById(
            data.purchaseEntry,
        );

    if (!purchaseEntry) {
        throw new Error("Purchase entry not found");
    }

    if (purchaseEntry.products.length !== data.products.length) {
        throw new Error("Damage quantities must be provided for every product");
    }

    const products = purchaseEntry.products.map((product: { purchaseQty: number; productName: any; purchaseRate: number; }, index: number) => {
        const damageQty = data.products[index]?.damageQty;

        if (
            typeof damageQty !== "number" ||
            !Number.isInteger(damageQty) ||
            damageQty < 0 ||
            damageQty > product.purchaseQty
        ) {
            throw new Error(
                `Invalid damage quantity for ${product.productName}`,
            );
        }

        const approvedQty = product.purchaseQty - damageQty;
        const payableAfterQC = approvedQty * product.purchaseRate;

        return {
            productName: product.productName,
            totalQty: product.purchaseQty,
            purchaseRate: product.purchaseRate,
            damageQty,
            approvedQty,
            availableQtyAfterQC: approvedQty,
            payableAfterQC,
        };
    });

    const totalApprovedQty = products.reduce(
        (total: any, product: { approvedQty: any; }) => total + product.approvedQty,
        0,
    );

    const totalDamagedQty = products.reduce(
        (total: any, product: { damageQty: any; }) => total + product.damageQty,
        0,
    );

    const availableQtyAfterQC = products.reduce(
        (total: any, product: { availableQtyAfterQC: any; }) => total + product.availableQtyAfterQC,
        0,
    );

    const payableAfterQC = products.reduce(
        (total: any, product: { payableAfterQC: any; }) => total + product.payableAfterQC,
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

    const qualityCheck = await purchaseQualityCheckRepo.createQualityCheck(
        qualityCheckData,
    );

    await purchaseQualityCheckRepo.updatePurchaseEntryQCStatus(
        data.purchaseEntry,
    );

    return qualityCheck;
};
export const getQualityCheckByIdService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(message.INVALID_QUALITY_CHECK_ID);
    }

    const qualityCheck =
        await purchaseQualityCheckRepo.findQualityCheckById(id);

    if (!qualityCheck) {
        throw new Error(message.PURCHASE_QUALITY_CHECK_NOT_FOUND);
    }

    const purchaseEntry = qualityCheck.purchaseEntry as any;

    const approvedProducts = qualityCheck.products
        .filter((product: { approvedQty: number }) => product.approvedQty > 0)
        .map((product: {
            productName: string;
            approvedQty: number;
            purchaseRate: number;
            payableAfterQC: number;
        }) => ({
            productName: product.productName,
            qty: product.approvedQty,
            rate: product.purchaseRate,
            amount: product.payableAfterQC,
        }));

    const damagedProducts = qualityCheck.products
        .filter((product: { damageQty: number; }) => product.damageQty > 0)
        .map((product: { productName: any; damageQty: number; purchaseRate: number; }) => ({
            productName: product.productName,
            qty: product.damageQty,
            rate: product.purchaseRate,
            amount: product.damageQty * product.purchaseRate,
        }));

    return {
        purchaseEntry: {
            _id: purchaseEntry._id,
            invoiceNo: purchaseEntry.invoiceNo,
            purchaseDate: purchaseEntry.purchaseDate,
            vendor: purchaseEntry.vendor,
        },
        summary: {
            availableQtyAfterQC: qualityCheck.availableQtyAfterQC,
            damagedQty: qualityCheck.totalDamagedQty,
            payableAfterQC: qualityCheck.payableAfterQC,
        },
        approvedProducts,
        damagedProducts,
    };
};

const formatQualityCheck = (qualityCheck: any) => {
    const purchaseEntry = qualityCheck.purchaseEntry;

    const approvedProducts = qualityCheck.products
        .filter((product: any) => product.approvedQty > 0)
        .map((product: any) => ({
            productName: product.productName,
            qty: product.approvedQty,
            rate: product.purchaseRate,
            amount: product.payableAfterQC,
        }));

    const damagedProducts = qualityCheck.products
        .filter((product: any) => product.damageQty > 0)
        .map((product: any) => ({
            productName: product.productName,
            qty: product.damageQty,
            rate: product.purchaseRate,
            amount: product.damageQty * product.purchaseRate,
        }));

    return {
        _id: qualityCheck._id,
        purchaseEntry: {
            _id: purchaseEntry?._id,
            invoiceNo: purchaseEntry?.itemMaster?.invoiceNo,
            purchaseDate: purchaseEntry?.purchaseDate,
            vendor: purchaseEntry?.vendor,
        },
        summary: {
            availableQtyAfterQC: qualityCheck.availableQtyAfterQC,
            damagedQty: qualityCheck.totalDamagedQty,
            payableAfterQC: qualityCheck.payableAfterQC,
        },
        approvedProducts,
        damagedProducts,
    };
};

export const getQualityCheckByPurchaseEntryService = async (
    purchaseEntryId: string,
) => {
    if (!mongoose.Types.ObjectId.isValid(purchaseEntryId)) {
        throw new Error(message.INVALID_PURCHASE_ENTRY_ID);
    }

    const qualityCheck =
        await purchaseQualityCheckRepo.findQualityCheckByPurchaseEntry(
            new mongoose.Types.ObjectId(purchaseEntryId),
        );

    if (!qualityCheck) {
        throw new Error(message.PURCHASE_QUALITY_CHECK_NOT_FOUND);
    }

    if (!qualityCheck.purchaseEntry) {
        throw new Error(message.PURCHASE_ENTRY_NOT_FOUND);
    }

    return formatQualityCheck(qualityCheck);
};

export const getAllQualityChecksService = async () => {
    const qualityChecks =
        await purchaseQualityCheckRepo.findAllQualityChecks();

    return qualityChecks.map(formatQualityCheck);
};