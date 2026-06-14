"use client";

// Dashboard view: the shared filter bar above the two charts. Reads the filters
// once and passes them to each chart so they share one source of truth.
// Lives in a client component because it (transitively) uses useSearchParams.

import { useFilters } from "@/hooks/useFilters";
import { GlobalFilters } from "./GlobalFilters";
import { EventsPerDayChart } from "./charts/EventsPerDayChart";
import { AlgorithmChart } from "./charts/AlgorithmChart";

export function Dashboard() {
  const { filters } = useFilters();

  return (
    <div className="flex flex-col gap-4">
      <GlobalFilters />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EventsPerDayChart filters={filters} />
        <AlgorithmChart filters={filters} />
      </div>
    </div>
  );
}
