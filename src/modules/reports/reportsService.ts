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
export const getAllDebitReportsService = async (
    page: number,
    limit: number,
) => {
    return reportsRepository.findAllDebitReports(page, limit);
};
export const getAllTransitReportsService = async (
    page: number,
    limit: number,
) => {
    return reportsRepository.findAllTransitReports(page, limit);
};