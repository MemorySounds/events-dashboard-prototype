"use client";

// TanStack Query wrapper for GET /events.
//
// Design note (see ARCHITECTURE/README): the global filters are applied
// SERVER-side, but pagination is NOT — we fetch the full *filtered* set in one
// request (a high limit, no offset) and let the Events table do local search,
// sort, and pagination in the browser. This keeps client-side "local filtering"
// correct (it sees every matching row, not just one server page). It's only
// sound because the dataset is small; the note explains the trade-off.

import { useQuery } from "@tanstack/react-query";
import { apiGet, type EventsResponse } from "@/lib/api";
import { filtersToQuery, type GlobalFilters } from "@/lib/filters";

// Comfortably above the seeded row count so a single page holds everything that
// matches the active server-side filters.
const FETCH_ALL_LIMIT = 100;

export function useEvents(filters: GlobalFilters) {
  const query = { ...filtersToQuery(filters), limit: FETCH_ALL_LIMIT, offset: 0 };
  return useQuery({
    queryKey: ["events", query],
    queryFn: () => apiGet<EventsResponse>("/events", query),
  });
}
