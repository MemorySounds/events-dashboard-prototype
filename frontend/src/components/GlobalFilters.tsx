"use client";

// The shared filter bar. Reads/writes the global filters via the URL (useFilters),
// so it stays in sync with every chart and table that consumes the same state.
// Rendered on every page that filters data.

import { ALGORITHMS, ASSET_TYPES, SEVERITIES } from "@/lib/api";
import { useFilters } from "@/hooks/useFilters";
import { Select } from "./ui/Select";
import { DateField } from "./ui/DateField";

export function GlobalFilters() {
  const { filters, setFilter, clearFilters } = useFilters();

  const hasActiveFilters = Object.keys(filters).length > 0;
  // ISO date strings (YYYY-MM-DD) compare correctly as plain strings.
  const invalidRange =
    !!filters.from && !!filters.to && filters.from > filters.to;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <Select
        label="Asset type"
        value={filters.assetType}
        options={ASSET_TYPES}
        onChange={(v) => setFilter("assetType", v)}
      />
      <Select
        label="Algorithm"
        value={filters.algorithm}
        options={ALGORITHMS}
        onChange={(v) => setFilter("algorithm", v)}
      />
      <Select
        label="Severity"
        value={filters.severity}
        options={SEVERITIES}
        onChange={(v) => setFilter("severity", v)}
      />

      <DateField
        label="From"
        value={filters.from}
        max={filters.to}
        onCommit={(v) => setFilter("from", v)}
      />
      <DateField
        label="To"
        value={filters.to}
        min={filters.from}
        onCommit={(v) => setFilter("to", v)}
      />

      <button
        type="button"
        onClick={clearFilters}
        disabled={!hasActiveFilters}
        className="ml-auto rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear filters
      </button>

      {invalidRange && (
        <p className="w-full text-xs text-red-600">
          The “From” date must be on or before the “To” date.
        </p>
      )}
    </div>
  );
}
