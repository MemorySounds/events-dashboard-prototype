"use client";

// Top IPs page view: shared filter bar above the ranked source-IP table, with a
// "top N" selector that drives the server-side limit. Mirrors EventsView's
// shape (read filters → fetch → render under QueryState).

import { useState } from "react";
import { useFilters } from "@/hooks/useFilters";
import { useTopSourceIps } from "@/hooks/useStats";
import { GlobalFilters } from "./GlobalFilters";
import { TopIpsTable } from "./TopIpsTable";
import { Card } from "./ui/Card";
import { QueryState } from "./ui/QueryState";

const LIMIT_OPTIONS = [10, 25, 50];

export function TopIpsView() {
  const { filters } = useFilters();
  const [limit, setLimit] = useState(10);
  const { data, isLoading, isError, error } = useTopSourceIps(filters, limit);
  const ips = data ?? [];

  const limitSelector = (
    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
      Show top
      <select
        value={limit}
        onChange={(e) => setLimit(Number(e.target.value))}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
      >
        {LIMIT_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      <GlobalFilters />
      <Card title="Top source IPs" action={limitSelector}>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={ips.length === 0}
          emptyMessage="No source IPs match the selected filters."
        >
          <TopIpsTable ips={ips} />
        </QueryState>
      </Card>
    </div>
  );
}
