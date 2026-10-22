import * as reportsRepository from "./reportsRepository";

export const getAllPurchaseEntryReportsService = async (
    page: number,
    limit: number,
) => {
    return reportsRepository.findAllPurchaseEntryReports(page, limit);
};
export const getAllSalesReportsService = async (
    page: number,
    limit: number,
    billId?: string,
) => {
    return reportsRepository.findAllSalesReports(page, limit, billId);
};