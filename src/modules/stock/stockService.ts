import mongoose from "mongoose";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import IndianStoreStockTransferModel from "../../models/indianStoreStockTransferModel";
import PackingListModel from "../../models/packingListModel";
import type { PackingStyleAllocation } from "../../models/packingListModel";

// TRP_MAIN STORE stock is derived, never stored:
//   available = approved qty after QC - qty moved to sample store - qty packed
export interface MainStockLine {
    qualityCheck: mongoose.Types.ObjectId;
    qualityCheckProduct: mongoose.Types.ObjectId;
    purchaseEntry: mongoose.Types.ObjectId;
    invoiceNo: string;
    purchaseDate: Date;
    vendor: { _id: mongoose.Types.ObjectId; vendorName: string } | null;
    productName: string;
    purchaseQtyAfterQC: number;
    sampleQty: number;
    packedQty: number;
    availableQty: number;
    rate: number;
}

export type StockSort = "date" | "vendor" | "product";

const sumByQualityCheckProduct = async (
    model: mongoose.Model<any>,
    pipeline: mongoose.PipelineStage[],
) => {
    const rows: { _id: mongoose.Types.ObjectId; qty: number }[] =
        await model.aggregate(pipeline);

    return new Map(rows.map((row) => [row._id.toString(), row.qty]));
};

const getSampleQtyMap = (excludeTransferId?: string) =>
    sumByQualityCheckProduct(IndianStoreStockTransferModel, [
        {
            $match: {
                isDeleted: false,
                ...(excludeTransferId && {
                    _id: {
                        $ne: new mongoose.Types.ObjectId(excludeTransferId),
                    },
                }),
            },
        },
        { $unwind: "$products" },
        {
            $group: {
                _id: "$products.qualityCheckProduct",
                qty: { $sum: "$products.transferredQty" },
            },
        },
    ]);

const getPackedQtyMap = (excludePackingListId?: string) =>
    sumByQualityCheckProduct(PackingListModel, [
        {
            $match: {
                isDeleted: false,
                ...(excludePackingListId && {
                    _id: {
                        $ne: new mongoose.Types.ObjectId(excludePackingListId),
                    },
                }),
            },
        },
        { $unwind: "$styles" },
        { $unwind: "$styles.allocations" },
        {
            $group: {
                _id: "$styles.allocations.qualityCheckProduct",
                qty: { $sum: "$styles.allocations.qty" },
            },
        },
    ]);

export const getMainStockLines = async (
    options: { excludePackingListId?: string } = {},
): Promise<MainStockLine[]> => {
    const [qualityChecks, sampleQty, packedQty] = await Promise.all([
        PurchaseQualityCheckModel.find({ isDeleted: false })
            .populate({
                path: "purchaseEntry",
                match: { isDeleted: false, qcStatus: "Done" },
                select: "invoiceNo purchaseDate vendor",
                populate: { path: "vendor", select: "vendorName" },
            })
            .lean(),
        getSampleQtyMap(),
        getPackedQtyMap(options.excludePackingListId),
    ]);

    const lines: MainStockLine[] = [];

    for (const qualityCheck of qualityChecks as any[]) {
        const purchaseEntry = qualityCheck.purchaseEntry;

        if (!purchaseEntry) continue;

        for (const product of qualityCheck.products ?? []) {
            const id = product._id.toString();
            const approvedQty = Number(product.availableQtyAfterQC ?? 0);
            const sample = sampleQty.get(id) ?? 0;
            const packed = packedQty.get(id) ?? 0;

            lines.push({
                qualityCheck: qualityCheck._id,
                qualityCheckProduct: product._id,
                purchaseEntry: purchaseEntry._id,
                invoiceNo: purchaseEntry.invoiceNo,
                purchaseDate: purchaseEntry.purchaseDate,
                vendor: purchaseEntry.vendor
                    ? {
                        _id: purchaseEntry.vendor._id,
                        vendorName: purchaseEntry.vendor.vendorName,
                    }
                    : null,
                productName: product.productName,
                purchaseQtyAfterQC: approvedQty,
                sampleQty: sample,
                packedQty: packed,
                availableQty: Math.max(0, approvedQty - sample - packed),
                rate: Number(product.purchaseRate ?? 0),
            });
        }
    }

    return lines;
};

export const filterAndSortStockLines = (
    lines: MainStockLine[],
    search?: string,
    sortBy: StockSort = "date",
) => {
    const query = search?.trim().toLowerCase();

    const filtered = query
        ? lines.filter(
            (line) =>
                line.productName.toLowerCase().includes(query) ||
                (line.vendor?.vendorName ?? "")
                    .toLowerCase()
                    .includes(query),
        )
        : lines;

    return [...filtered].sort((a, b) => {
        if (sortBy === "vendor") {
            return (a.vendor?.vendorName ?? "").localeCompare(
                b.vendor?.vendorName ?? "",
            );
        }

        if (sortBy === "product") {
            return a.productName.localeCompare(b.productName);
        }

        return (
            new Date(b.purchaseDate).getTime() -
            new Date(a.purchaseDate).getTime()
        );
    });
};

export const findMainStockLine = async (qualityCheckProductId: string) => {
    const lines = await getMainStockLines();

    return (
        lines.find(
            (line) =>
                line.qualityCheckProduct.toString() === qualityCheckProductId,
        ) ?? null
    );
};

const isSameVendor = (line: MainStockLine, vendorId: string) =>
    line.vendor?._id.toString() === vendorId;

/**
 * Products / vendors / qty available for packing.
 * - no args: distinct product names that still have stock
 * - productName: vendors that still have that product
 * - productName + vendor: available qty for that pair
 */
export const getAvailableForPacking = async (
    productName?: string,
    vendorId?: string,
) => {
    const lines = (await getMainStockLines()).filter(
        (line) => line.availableQty > 0,
    );

    if (!productName) {
        const products = new Map<string, number>();

        for (const line of lines) {
            products.set(
                line.productName,
                (products.get(line.productName) ?? 0) + line.availableQty,
            );
        }

        return [...products].map(([name, availableQty]) => ({
            productName: name,
            availableQty,
        }));
    }

    const productLines = lines.filter(
        (line) => line.productName === productName,
    );

    if (!vendorId) {
        const vendors = new Map<
            string,
            { vendor: MainStockLine["vendor"]; availableQty: number }
        >();

        for (const line of productLines) {
            if (!line.vendor) continue;

            const key = line.vendor._id.toString();
            const current = vendors.get(key);

            vendors.set(key, {
                vendor: line.vendor,
                availableQty: (current?.availableQty ?? 0) + line.availableQty,
            });
        }

        return [...vendors.values()];
    }

    return {
        productName,
        vendor: vendorId,
        availableQty: productLines
            .filter((line) => isSameVendor(line, vendorId))
            .reduce((total, line) => total + line.availableQty, 0),
    };
};

/**
 * Takes `qty` of a product from one vendor out of TRP_MAIN STORE, oldest
 * purchase first. `reserved` holds qty already claimed per QC product by
 * earlier styles of the same packing list.
 */
export const allocateFromMainStock = (
    lines: MainStockLine[],
    productName: string,
    vendorId: string,
    qty: number,
    reserved: Map<string, number>,
): PackingStyleAllocation[] => {
    const candidates = lines
        .filter(
            (line) =>
                line.productName === productName &&
                isSameVendor(line, vendorId),
        )
        .sort(
            (a, b) =>
                new Date(a.purchaseDate).getTime() -
                new Date(b.purchaseDate).getTime(),
        );

    const allocations: PackingStyleAllocation[] = [];
    let remaining = qty;

    for (const line of candidates) {
        if (remaining <= 0) break;

        const key = line.qualityCheckProduct.toString();
        const free = line.availableQty - (reserved.get(key) ?? 0);

        if (free <= 0) continue;

        const take = Math.min(free, remaining);

        allocations.push({
            qualityCheckProduct: line.qualityCheckProduct,
            purchaseEntry: line.purchaseEntry,
            qty: take,
            rate: line.rate,
        });

        reserved.set(key, (reserved.get(key) ?? 0) + take);
        remaining -= take;
    }

    if (remaining > 0) {
        throw new Error("INSUFFICIENT_MAIN_STORE_STOCK");
    }

    return allocations;
};
