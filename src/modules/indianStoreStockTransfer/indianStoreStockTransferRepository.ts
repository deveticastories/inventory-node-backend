
import mongoose from "mongoose";
import IndianStoreStockTransfer from "../../models/indianStoreStockTransferModel";
import Store from "../../models/storeModel";
import QualityCheck from "../../models/purchaseQualityCheckModel";

export const findStoreById = async (storeId: string) => {
    if (!mongoose.isValidObjectId(storeId)) {
        return null;
    }

    return Store.findOne({
        _id: new mongoose.Types.ObjectId(storeId),
        isDeleted: false,
    }).exec();
};

export const findQualityCheckProduct = async (productId: string) => {
    if (!mongoose.isValidObjectId(productId)) {
        return null;
    }

    return QualityCheck.findOne({
        "products._id": new mongoose.Types.ObjectId(productId),
        isDeleted: false,
    }).exec();
};

export const getQualityCheckProducts = async (storeId: string) => {
    if (!mongoose.isValidObjectId(storeId)) {
        return [];
    }

    const qualityChecks = await QualityCheck.find({
        store: new mongoose.Types.ObjectId(storeId),
        isDeleted: false,
    }).exec();

    return qualityChecks.flatMap((qualityCheck: any) =>
        (qualityCheck.products ?? []).map((product: any) => ({
            _id: product._id,
            qualityCheckProduct: product,
            productName: product.productName,
            rate: product.rate ?? 0,
            availableQty: product.availableQty ?? product.qty ?? 0,
        })),
    );
};
export const getTransferredProductsForStore = async (storeId: string) => {
    if (!mongoose.isValidObjectId(storeId)) {
        return [];
    }

    const transfers = await IndianStoreStockTransfer.find({
        toStore: new mongoose.Types.ObjectId(storeId),
        isDeleted: false,
    })
        .populate("fromStore")
        .populate("toStore")
        .sort({ createdAt: -1 })
        .exec();

    const results: any[] = [];

    for (const transfer of transfers) {
        for (const product of transfer.products ?? []) {
            const qualityCheckProductId =
                (product.qualityCheckProduct as any)?._id ??
                product.qualityCheckProduct;

            const qualityCheck = mongoose.isValidObjectId(
                qualityCheckProductId,
            )
                ? await QualityCheck.findOne({
                    "products._id": new mongoose.Types.ObjectId(
                        qualityCheckProductId.toString(),
                    ),
                    isDeleted: false,
                })
                    .lean()
                    .exec()
                : null;

            const qualityCheckProduct =
                qualityCheck?.products?.find(
                    (qcProduct: any) =>
                        qcProduct._id?.toString() ===
                        qualityCheckProductId?.toString(),
                ) ?? null;

            results.push({
                _id: product._id,
                indianStoreStockTransfer: transfer.toObject(),
                indianStoreStockTransferProduct: product.toObject(),
                qualityCheckProduct,
                productName:
                    qualityCheckProduct?.productName ?? product.productName,
                transferredQty: product.transferredQty,
                availableQty: product.availableQty,
                rate: product.rate,
                total: product.total,
                fromStore: transfer.fromStore,
                toStore: transfer.toStore,
                transferDate: transfer.transferDate,
                createdAt: transfer.createdAt,
            });
        }
    }

    return results;
};

export const getAvailableQty = async (
    storeId: string,
    qualityCheckProductId: string,
    excludeTransferId?: string,
): Promise<number> => {
    console.log("========== getAvailableQty START ==========");
    console.log("storeId:", storeId);
    console.log("qualityCheckProductId:", qualityCheckProductId);
    console.log("excludeTransferId:", excludeTransferId);

    if (
        !mongoose.isValidObjectId(storeId) ||
        !mongoose.isValidObjectId(qualityCheckProductId)
    ) {
        console.log("Invalid storeId:", mongoose.isValidObjectId(storeId));
        console.log(
            "Invalid qualityCheckProductId:",
            mongoose.isValidObjectId(qualityCheckProductId),
        );
        console.log("Returning quantity: 0");
        console.log("========== getAvailableQty END ==========");

        return 0;
    }

    const match: Record<string, unknown> = {
        toStore: new mongoose.Types.ObjectId(storeId),
        isDeleted: false,
    };

    if (
        excludeTransferId &&
        mongoose.isValidObjectId(excludeTransferId)
    ) {
        match._id = {
            $ne: new mongoose.Types.ObjectId(excludeTransferId),
        };
    }

    console.log("MongoDB match query:", match);

    const transfers = await IndianStoreStockTransfer.find(match)
        .select("products toStore fromStore isDeleted")
        .lean()
        .exec();

    console.log("Transfers found:", transfers.length);
    console.log("All fetched transfers:", JSON.stringify(transfers, null, 2));

    let transferredQty = 0;

    for (const transfer of transfers as any[]) {
        console.log("----------------------------------------");
        console.log("Transfer ID:", transfer._id);
        console.log("From store:", transfer.fromStore);
        console.log("To store:", transfer.toStore);
        console.log("Deleted:", transfer.isDeleted);
        console.log("Products in transfer:", transfer.products);

        for (const product of transfer.products ?? []) {
            console.log("Product ID:", product._id);
            console.log(
                "Quality check product ID:",
                product.qualityCheckProduct,
            );
            console.log("Product name:", product.productName);
            console.log("Transferred quantity:", product.transferredQty);
            console.log("Rate:", product.rate);
            console.log("Total:", product.total);

            const matches =
                product.qualityCheckProduct?.toString() ===
                qualityCheckProductId;

            console.log("Matches requested product:", matches);

            if (matches) {
                const qty = Number(product.transferredQty ?? 0);
                transferredQty += qty;

                console.log("Quantity added:", qty);
                console.log("Running total:", transferredQty);
            }
        }
    }

    console.log("Final transferred quantity:", transferredQty);
    console.log("========== getAvailableQty END ==========");

    return transferredQty;
};

export const createIndianStoreStockTransfer = async (
    transferData: Record<string, unknown>,
) => {
    const transfer = new IndianStoreStockTransfer(transferData);
    await transfer.save();

    return IndianStoreStockTransfer.findById(transfer._id)
        .populate("fromStore")
        .populate("toStore")
        .populate("products.qualityCheckProduct")
        .exec();
};

export const findIndianStoreStockTransferById = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        return null;
    }

    return IndianStoreStockTransfer.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
    })
        .populate("fromStore")
        .populate("toStore")
        .populate("products.qualityCheckProduct")
        .exec();
};

export const findAllIndianStoreStockTransfers = async (
    page: number,
    limit: number,
    search?: string,
    fromStore?: string,
    toStore?: string,
) => {
    const filter: Record<string, any> = {
        isDeleted: false,
    };

    if (fromStore) {
        filter.fromStore = new mongoose.Types.ObjectId(fromStore);
    }

    if (toStore) {
        filter.toStore = new mongoose.Types.ObjectId(toStore);
    }

    if (search) {
        filter.$or = [
            { transferId: { $regex: search, $options: "i" } },
            { "products.productName": { $regex: search, $options: "i" } },
        ];
    }

    const skip = (page - 1) * limit;

    const [transfers, totalRecords] = await Promise.all([
        IndianStoreStockTransfer.find(filter)
            .populate("fromStore")
            .populate("toStore")
            .populate("products.qualityCheckProduct")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        IndianStoreStockTransfer.countDocuments(filter),
    ]);

    return {
        data: transfers,
        pagination: {
            currentPage: page,
            limit,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            hasPreviousPage: page > 1,
            hasNextPage: page < Math.ceil(totalRecords / limit),
        },
    };
}; export const getTransferredProductsFromStore = async (
    storeId: string,
) => {
    if (!mongoose.isValidObjectId(storeId)) {
        return [];
    }

    const transfers = await IndianStoreStockTransfer.find({
        fromStore: new mongoose.Types.ObjectId(storeId),
        isDeleted: false,
    })
        .populate("fromStore")
        .populate("toStore")
        .sort({ createdAt: -1 })
        .exec();

    return transfers.flatMap((transfer: any) =>
        (transfer.products ?? []).map((product: any) => ({
            _id: product._id,
            indianStoreStockTransfer: transfer.toObject(),
            indianStoreStockTransferProduct: product.toObject(),
            qualityCheckProduct: product.qualityCheckProduct,
            productName: product.productName,
            transferredQty: product.transferredQty,
            availableQty: product.availableQty,
            rate: product.rate,
            total: product.total,
            fromStore: transfer.fromStore,
            toStore: transfer.toStore,
            transferDate: transfer.transferDate,
            createdAt: transfer.createdAt,
        })),
    );
};