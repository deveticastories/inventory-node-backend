
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  currentPage: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const getPaginationParams = (
  query: { page?: unknown; limit?: unknown },
): PaginationParams => {
  const pageValue = query.page ?? "1";
  const limitValue = query.limit ?? "10";

  const page = Number(pageValue);
  const limit = Number(limitValue);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1
  ) {
    throw new Error("Page and limit must be positive integers");
  }

  return {
    page,
    limit: Math.min(limit, 100),
  };
};

export const getPaginationMeta = (
  page: number,
  limit: number,
  totalRecords: number,
): PaginationMeta => {
  const totalPages = Math.ceil(totalRecords / limit);

  return {
    currentPage: page,
    limit,
    totalRecords,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
};
