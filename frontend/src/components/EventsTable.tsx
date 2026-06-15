"use client";

// Detailed events table with LOCAL search, sort, and pagination.
//
// The global (server-side) filters already narrowed the rows we received; this
// component does the *client-side* work on that full set: a quick-search box, a
// sortable header, and pagination. Because we hold every matching row in memory
// (useEvents fetches the whole filtered set, no server paging), search and sort
// see all rows — not just one page — which is the correctness point behind the
// "server-filter, client-paginate" decision.

import { useMemo, useState } from "react";
import type { Event } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { SeverityBadge } from "./ui/SeverityBadge";

const PAGE_SIZE = 10;

// Columns in display order. `key` drives both rendering and sorting.
const COLUMNS: { key: keyof Event; label: string }[] = [
  { key: "observedAt", label: "Observed" },
  { key: "assetId", label: "Asset" },
  { key: "assetType", label: "Type" },
  { key: "algorithm", label: "Algorithm" },
  { key: "severity", label: "Severity" },
  { key: "sourceIp", label: "Source IP" },
  { key: "eventType", label: "Event" },
];

// `null` = no explicit sort (fall back to the API's order, which is newest-first).
type SortState = { key: keyof Event; dir: "asc" | "desc" } | null;

export function EventsTable({ events }: { events: Event[] }) {
  const [search, setSearch] = useState("");
  // Start unsorted; the rows already arrive newest-first from the API.
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);

  // Local quick-search: case-insensitive substring match against a per-row
  // search string built only from the *displayed* values — so what matches is
  // exactly what's on screen. (We deliberately do NOT index the raw ISO date:
  // it's UTC, while the cell shows local time, so searching it would match rows
  // whose visible time differs. The global from/to filter is the real date tool.)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      [
        formatDateTime(e.observedAt),
        e.assetId,
        e.assetType,
        e.algorithm,
        e.severity,
        e.sourceIp,
        e.eventType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [events, search]);

  // Sort a copy (never mutate the query data). ISO date strings sort
  // chronologically under plain string comparison, so one comparator covers all.
  // When unsorted, keep the API's order untouched.
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => {
      const av = String(a[key]);
      const bv = String(b[key]);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  // Reset to page 1 when the underlying set changes (new server data or a new
  // search), so the user never lands on a now-empty page. Done during render —
  // the React-recommended alternative to a setState-in-effect, which avoids an
  // extra render pass (see react.dev "You Might Not Need an Effect").
  const [resetOn, setResetOn] = useState({ search, events });
  if (resetOn.search !== search || resetOn.events !== events) {
    setResetOn({ search, events });
    setPage(1);
  }

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(start, start + PAGE_SIZE);

  // Tri-state cycle per column: asc → desc → unsorted → asc. Clicking a
  // different column starts fresh at ascending.
  function toggleSort(key: keyof Event) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + result count */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          className="w-64 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navy focus:outline-none"
        />
        <span className="text-xs text-gray-500">
          {sorted.length === 0
            ? "No matching rows"
            : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, sorted.length)} of ${sorted.length}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {COLUMNS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium hover:text-gray-700"
                >
                  {label}
                  {sort?.key === key && (
                    <span className="ml-1">{sort.dir === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                  {formatDateTime(e.observedAt)}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-700">{e.assetId}</td>
                <td className="px-3 py-2 text-gray-700">{e.assetType}</td>
                <td className="px-3 py-2 text-gray-700">{e.algorithm}</td>
                <td className="px-3 py-2">
                  <SeverityBadge severity={e.severity} />
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-700">{e.sourceIp}</td>
                <td className="px-3 py-2 text-gray-700">{e.eventType}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-6 text-center text-gray-400">
                  No events match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage <= 1}
          className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-xs text-gray-500">
          Page {safePage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage >= totalPages}
          className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
