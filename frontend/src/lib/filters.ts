// The global filter set, shared across all pages and persisted in the URL
// query string (so views are shareable and survive refresh). These mirror the
// server-side filters on the backend's shared `eventFilterSchema`.

import type { ApiQuery } from "./api";

// All values are strings because they live in the URL. `from`/`to` are
// ISO-ish date strings (YYYY-MM-DD); the backend coerces them with z.coerce.date().
export interface GlobalFilters {
  assetType?: string;
  algorithm?: string;
  severity?: string;
  from?: string;
  to?: string;
}

// The URL param keys we treat as global filters. Anything else in the URL
// (e.g. a page's own local state) is ignored by the filter layer.
export const FILTER_KEYS = ["assetType", "algorithm", "severity", "from", "to"] as const;

// Read the known filter keys out of a URLSearchParams into a typed object,
// skipping any that are absent/empty.
export function parseFilters(params: URLSearchParams): GlobalFilters {
  const filters: GlobalFilters = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  return filters;
}

// Filters are already in the exact shape the API expects, so this is a passthrough
// today — it exists as the single, named seam where the two could diverge later.
export function filtersToQuery(filters: GlobalFilters): ApiQuery {
  return { ...filters };
}
