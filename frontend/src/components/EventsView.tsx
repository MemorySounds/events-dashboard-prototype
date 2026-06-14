"use client";

// Events page view: shared filter bar above the detailed events table. Fetches
// the full server-filtered set (useEvents) and hands it to EventsTable, which
// does the local search/sort/pagination. QueryState covers the server-side
// loading/error/empty states.

import { useFilters } from "@/hooks/useFilters";
import { useEvents } from "@/hooks/useEvents";
import { GlobalFilters } from "./GlobalFilters";
import { EventsTable } from "./EventsTable";
import { Card } from "./ui/Card";
import { QueryState } from "./ui/QueryState";

export function EventsView() {
  const { filters } = useFilters();
  const { data, isLoading, isError, error } = useEvents(filters);
  const events = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <GlobalFilters />
      <Card title="Events">
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={events.length === 0}
          emptyMessage="No events match the selected filters."
        >
          <EventsTable events={events} />
        </QueryState>
      </Card>
    </div>
  );
}
