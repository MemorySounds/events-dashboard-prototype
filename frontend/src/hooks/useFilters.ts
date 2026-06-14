"use client";

// Reads the global filters from the URL and writes them back, so the URL is the
// single source of truth for filter state. Every page/chart consumes the same
// `filters` object; updating one filter re-renders all subscribers via the URL.

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FILTER_KEYS,
  parseFilters,
  type GlobalFilters,
} from "@/lib/filters";

export interface UseFiltersResult {
  filters: GlobalFilters;
  // Set or clear a single filter (empty/undefined value removes the key).
  setFilter: (key: keyof GlobalFilters, value: string | undefined) => void;
  // Remove every global filter from the URL at once.
  clearFilters: () => void;
}

export function useFilters(): UseFiltersResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // Push a new URL built from the current params plus the requested change.
  // `scroll: false` keeps the viewport put while filtering.
  const setFilter = useCallback(
    (key: keyof GlobalFilters, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) params.delete(key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  return { filters, setFilter, clearFilters };
}
