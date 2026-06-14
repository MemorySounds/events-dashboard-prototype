"use client";

// TanStack Query wrappers for the /stats/* aggregate endpoints. Each hook takes
// the global filters and keys its cache on them, so changing a filter triggers
// a refetch and the charts stay in sync with the URL.

import { useQuery } from "@tanstack/react-query";
import { apiGet, type AlgorithmCount, type DayCount, type TopIp } from "@/lib/api";
import { filtersToQuery, type GlobalFilters } from "@/lib/filters";

interface Envelope<T> {
  data: T;
}

// GET /stats/events-per-day — daily event volume (dashboard trend line).
export function useEventsPerDay(filters: GlobalFilters) {
  const query = filtersToQuery(filters);
  return useQuery({
    queryKey: ["events-per-day", query],
    queryFn: () =>
      apiGet<Envelope<DayCount[]>>("/stats/events-per-day", query).then((r) => r.data),
  });
}

// GET /stats/by-algorithm — counts per algorithm, optionally split by severity.
export function useByAlgorithm(filters: GlobalFilters, breakdownBySeverity: boolean) {
  const query = { ...filtersToQuery(filters), breakdownBySeverity };
  return useQuery({
    queryKey: ["by-algorithm", query],
    queryFn: () =>
      apiGet<Envelope<AlgorithmCount[]>>("/stats/by-algorithm", query).then((r) => r.data),
  });
}

// GET /stats/top-source-ips — busiest source IPs with a per-severity breakdown.
export function useTopSourceIps(filters: GlobalFilters, limit = 10) {
  const query = { ...filtersToQuery(filters), limit };
  return useQuery({
    queryKey: ["top-source-ips", query],
    queryFn: () =>
      apiGet<Envelope<TopIp[]>>("/stats/top-source-ips", query).then((r) => r.data),
  });
}
