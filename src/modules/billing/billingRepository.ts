
import mongoose from "mongoose";
import BillingModel, { type Billing } from "../../models/billingModel";

export const createBilling = async (data: Partial<Billing>) => {
    return BillingModel.create(data);
};

export const findAllBillings = async (
    page: number,
    limit: number,
    search?: string,
    customer?: string,
) => {
    const filter: Record<string, unknown> = {
        isDeleted: false,
    };

    if (search?.trim()) {
        filter.invoiceNo = {
            $regex: search.trim(),
            $options: "i",
        };
    }

    if (customer) {
        if (!mongoose.Types.ObjectId.isValid(customer)) {
            throw new Error("CUSTOMER_ID_INVALID");
        }

        filter.customer = new mongoose.Types.ObjectId(customer);
    }

    const skip = (page - 1) * limit;

    const [data, totalRecords] = await Promise.all([
        BillingModel.find(filter)
            .populate("customer")
            .populate({
                path: "products.uaeStoreStockTransfer",
                populate: [
                    {
                        path: "packingList",
                    },
                    {
                        path: "fromStore",
                    },
                    {
                        path: "toStore",
                    },
                ],
            })
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        BillingModel.countDocuments(filter),
    ]);

    return {
        data,
        totalRecords,
    };
};

export const findBillingById = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    return BillingModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
    })
        .populate("customer")
        .populate({
            path: "products.uaeStoreStockTransfer",
            populate: [
                {
                    path: "packingList",
                },
                {
                    path: "fromStore",
                },
                {
                    path: "toStore",
                },
            ],
        });
};

export const updateBillingById = async (
    id: string,
    data: Partial<Billing>,
) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    return BillingModel.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(id),
            isDeleted: false,
        },
        {
            $set: data,
        },
        {
            new: true,
            runValidators: true,
        },
    )
        .populate("customer")
        .populate({
            path: "products.uaeStoreStockTransfer",
            populate: [
                {
                    path: "packingList",
                },
                {
                    path: "fromStore",
                },
                {
                    path: "toStore",
                },
            ],
        });
};

export const softDeleteBillingById = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    return BillingModel.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(id),
            isDeleted: false,
        },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        },
        {
            new: true,
        },
    );
};
export const generateInvoiceNo = async (): Promise<string> => {
    const lastBilling = await BillingModel.findOne({
        invoiceNo: { $regex: /^INV-\d+$/ },
    })
        .sort({ createdAt: -1 })
        .select("invoiceNo")
        .lean();

    const lastNumber = lastBilling
        ? parseInt(lastBilling.invoiceNo.replace("INV-", ""), 10)
        : 0;

    return `INV-${String(lastNumber + 1).padStart(4, "0")}`;
};