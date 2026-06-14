// Base fetch client + shared domain types for the backend API.
//
// These types mirror the backend's Zod enums and response envelopes
// (see ../../backend/src/schemas.ts). They are duplicated by hand rather
// than shared via a package — the two apps are independent deployables, and
// at this size a small, explicit copy is clearer than a build-time link.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ---- Categorical domain values (mirror backend enums) ----------------------

export const ASSET_TYPES = ["certificate", "ssh-key", "api-key"] as const;
export const ALGORITHMS = [
  "RSA2048",
  "RSA1024",
  "ECDSA-P256",
  "Ed25519",
  "SHA1",
  "3DES",
] as const;
export const SEVERITIES = ["info", "warning", "critical"] as const;
export const EVENT_TYPES = [
  "observed",
  "rotation",
  "expiration-warning",
  "error",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];
export type Algorithm = (typeof ALGORITHMS)[number];
export type Severity = (typeof SEVERITIES)[number];
export type EventType = (typeof EVENT_TYPES)[number];

// ---- Entity + response shapes ----------------------------------------------

// A single event row from GET /events. `observedAt` is an ISO string — dates
// cross the wire as JSON strings, not Date objects.
export interface Event {
  id: string;
  assetId: string;
  assetType: AssetType;
  algorithm: Algorithm;
  severity: Severity;
  sourceIp: string;
  observedAt: string;
  eventType: EventType;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface EventsResponse {
  data: Event[];
  pagination: Pagination;
}

// Stats endpoints all return a bare { data } envelope.
export interface DayCount {
  day: string; // YYYY-MM-DD
  count: number;
}

export interface AlgorithmCount {
  algorithm: Algorithm;
  severity?: Severity; // present only when breakdownBySeverity=true
  count: number;
}

export interface InventoryRow {
  algorithm: Algorithm;
  assetType: AssetType;
  count: number; // distinct assets, not events
}

export interface TopIp {
  sourceIp: string;
  total: number;
  bySeverity: Record<Severity, number>;
}

// ---- Query string + fetch helpers ------------------------------------------

// The shared filter set sent to the server. Dates are passed as ISO strings.
// Everything is optional — only set keys are serialized.
export interface ApiQuery {
  [key: string]: string | number | boolean | undefined;
}

// Build a `?a=1&b=2` string from a params object, dropping any key whose value
// is undefined or empty. Keeps URLs clean and lets callers spread partial
// filters without guarding each one.
export function toQueryString(params: ApiQuery): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// Error carrying the HTTP status so callers/UI can distinguish 4xx vs 5xx.
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Typed GET against the API. Throws ApiError on a non-2xx response so
// TanStack Query surfaces it as an error state.
export async function apiGet<T>(path: string, params: ApiQuery = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}${toQueryString(params)}`);

  if (!res.ok) {
    // The backend error middleware returns { error: ... }; fall back to status text.
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) detail = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(`GET ${path} failed (${res.status}): ${detail}`, res.status);
  }

  return res.json() as Promise<T>;
}
