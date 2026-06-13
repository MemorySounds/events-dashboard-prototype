export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

// Derive page-control fields from the offset primitives. `limit` is always >= 1
// (schema-enforced), so the division is safe.
export function buildPagination(total: number, limit: number, offset: number): Pagination {
  return {
    total,
    limit,
    offset,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit),
    hasPrev: offset > 0,
    hasNext: offset + limit < total,
  };
}
