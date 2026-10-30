import mongoose from "mongoose";
import PurchaseEntryModel from "../../models/purchaseEntryModel";
import PurchaseQualityCheckModel from "../../models/purchaseQualityCheckModel";
import PaymentEntryModel from "../../models/paymentEntryModel";
import BillingModel from "../../models/billingModel";
import { round2 } from "../../utils/errorStatus";

// Vendor payable comes only from QC-completed invoices (GST-adjusted
// payable after QC) minus payments. Customer outstanding is the sum of
// invoice balances (net of returns and receipts).

const getPurchasePositions = async (vendorId?: string) => {
    const purchases = await PurchaseEntryModel.find({
        isDeleted: false,
        ...(vendorId && { vendor: new mongoose.Types.ObjectId(vendorId) }),
    })
        .sort({ purchaseDate: -1 })
        .lean<any[]>();

    const ids = purchases.map((purchase) => purchase._id);

    const [qualityChecks, payments] = await Promise.all([
        PurchaseQualityCheckModel.find({
            purchaseEntry: { $in: ids },
            isDeleted: false,
        })
            .select("purchaseEntry payableAfterQC createdAt")
            .lean<any[]>(),
        PaymentEntryModel.find({
            purchaseInvoice: { $in: ids },
            isDeleted: false,
        })
            .sort({ createdAt: 1 })
            .lean<any[]>(),
    ]);

    const qcByPurchase = new Map(
        qualityChecks.map((qc) => [qc.purchaseEntry.toString(), qc]),
    );

    const positions = purchases.map((purchase) => {
        const qc = qcByPurchase.get(purchase._id.toString());
        const qcDone = purchase.qcStatus === "Done" && Boolean(qc);
        const paid = payments
            .filter(
                (payment) =>
                    payment.purchaseInvoice.toString() === purchase._id.toString(),
            )
            .reduce((total, payment) => total + payment.paidAmount, 0);
        const payable = qcDone ? qc.payableAfterQC : 0;

        return {
            _id: purchase._id,
            invoiceNo: purchase.invoiceNo,
            purchaseDate: purchase.purchaseDate,
            vendor: purchase.vendor,
            qcStatus: purchase.qcStatus,
            qcDate: qc?.createdAt,
            // Before QC the invoice amount shown is the GST total
            invoiceAmount: qcDone ? payable : purchase.totalIncludingGST,
            paidAmount: round2(paid),
            balanceAmount: qcDone ? round2(payable - paid) : null,
        };
    });

    return { positions, payments };
};

export const getVendorOutstandingMap = async () => {
    const { positions } = await getPurchasePositions();
    const outstanding = new Map<string, number>();

    for (const position of positions) {
        if (position.balanceAmount === null) continue;

        const key = position.vendor.toString();
        outstanding.set(
            key,
            round2((outstanding.get(key) ?? 0) + position.balanceAmount),
        );
    }

    return outstanding;
};

/** Vendor details: outstanding, last purchases and payment history ledger. */
export const getVendorLedger = async (vendorId: string) => {
    const { positions, payments } = await getPurchasePositions(vendorId);

    const entries = [
        ...positions
            .filter((position) => position.balanceAmount !== null)
            .map((position) => ({
                date: position.qcDate ?? position.purchaseDate,
                type: "Payable after QC",
                reference: position.invoiceNo,
                payable: position.invoiceAmount,
                paid: 0,
            })),
        ...payments.map((payment) => ({
            date: payment.paymentDate ?? payment.createdAt,
            type: "Payment",
            reference: `${payment.paymentVoucherNo} (${
                positions.find(
                    (position) =>
                        position._id.toString() ===
                        payment.purchaseInvoice.toString(),
                )?.invoiceNo ?? ""
            })`,
            payable: 0,
            paid: payment.paidAmount,
        })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;

    const paymentHistory = entries.map((entry) => {
        running += entry.payable - entry.paid;
        return { ...entry, runningOutstanding: round2(running) };
    });

    return {
        outstandingAmount: round2(
            positions.reduce(
                (total, position) => total + (position.balanceAmount ?? 0),
                0,
            ),
        ),
        purchases: positions,
        paymentHistory,
    };
};

export const getCustomerOutstandingMap = async () => {
    const rows: { _id: mongoose.Types.ObjectId; outstanding: number }[] =
        await BillingModel.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: "$customer", outstanding: { $sum: "$balanceAmount" } } },
        ]);

    return new Map(rows.map((row) => [row._id.toString(), round2(row.outstanding)]));
};

/** Customer statement: all / paid / outstanding invoices. */
export const getCustomerStatement = async (
    customerId: string,
    status: "all" | "paid" | "outstanding" = "all",
) => {
    const invoices = await BillingModel.find({
        customer: new mongoose.Types.ObjectId(customerId),
        isDeleted: false,
        ...(status === "paid" && { balanceAmount: { $lte: 0.5 } }),
        ...(status === "outstanding" && { balanceAmount: { $gt: 0.5 } }),
    })
        .select("invoiceNo date invoiceTotal returnAmount netAmount receivedAmount balanceAmount")
        .sort({ date: -1 })
        .lean<any[]>();

    const outstanding = await getCustomerOutstandingMap();

    return {
        outstandingAmount: outstanding.get(customerId) ?? 0,
        invoices,
    };
};
