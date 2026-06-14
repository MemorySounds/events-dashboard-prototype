"use client";

// The shared filter bar. Reads/writes the global filters via the URL (useFilters),
// so it stays in sync with every chart and table that consumes the same state.
// Rendered on every page that filters data.

import { ALGORITHMS, ASSET_TYPES, SEVERITIES } from "@/lib/api";
import { useFilters } from "@/hooks/useFilters";
import { Select } from "./ui/Select";

export function GlobalFilters() {
  const { filters, setFilter, clearFilters } = useFilters();

  const hasActiveFilters = Object.keys(filters).length > 0;

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

      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
        From
        <input
          type="date"
          value={filters.from ?? ""}
          onChange={(e) => setFilter("from", e.target.value || undefined)}
          // Open the native calendar on click anywhere (not just the icon),
          // while still allowing manual typing. showPicker is modern-browser only.
          onClick={(e) => e.currentTarget.showPicker?.()}
          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-navy focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
        To
        <input
          type="date"
          value={filters.to ?? ""}
          onChange={(e) => setFilter("to", e.target.value || undefined)}
          onClick={(e) => e.currentTarget.showPicker?.()}
          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-navy focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={clearFilters}
        disabled={!hasActiveFilters}
        className="ml-auto rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear filters
      </button>
    </div>
  );
}
