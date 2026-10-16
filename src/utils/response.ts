import type { PaginationMeta } from "./pagination";

export const paginatedResponse = <T>(
  data: T[],
  pagination: PaginationMeta,
) => ({
  success: true,
  data,
  pagination,
});
