"use client";

// Event counts per algorithm as a bar chart (GET /stats/by-algorithm). A local
// toggle switches between a single total bar and a per-severity stacked bar —
// this is a chart-specific control, not a global filter, so it lives in local
// state rather than the URL.

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useByAlgorithm } from "@/hooks/useStats";
import { SEVERITIES } from "@/lib/api";
import type { GlobalFilters } from "@/lib/filters";
import { ACCENT_COLOR, SEVERITY_COLORS } from "@/lib/colors";
import { Card } from "../ui/Card";
import { QueryState } from "../ui/QueryState";
import { ChartTooltip } from "./ChartTooltip";

// One chart row per algorithm. `count` is used for the single-bar view;
// the severity keys (info/warning/critical) are used for the stacked view.
type ChartRow = { algorithm: string } & Record<string, string | number>;

// Pivot the flat {algorithm, severity, count} rows into one row per algorithm
// with a column per severity — the shape a stacked BarChart wants.
function pivotBySeverity(
  rows: { algorithm: string; severity?: string; count: number }[],
): ChartRow[] {
  const byAlgorithm = new Map<string, ChartRow>();
  for (const row of rows) {
    const entry = byAlgorithm.get(row.algorithm) ?? { algorithm: row.algorithm };
    if (row.severity) entry[row.severity] = row.count;
    byAlgorithm.set(row.algorithm, entry);
  }
  return Array.from(byAlgorithm.values());
}

export function AlgorithmChart({ filters }: { filters: GlobalFilters }) {
  const [breakdown, setBreakdown] = useState(false);
  const { data, isLoading, isError, error } = useByAlgorithm(filters, breakdown);

  // Normalise both views to ChartRow[] so the BarChart has one stable data type.
  const chartData = useMemo<ChartRow[]>(
    () =>
      breakdown
        ? pivotBySeverity(data ?? [])
        : (data ?? []).map((row) => ({ algorithm: row.algorithm, count: row.count })),
    [breakdown, data],
  );

  const toggle = (
    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
      <input
        type="checkbox"
        checked={breakdown}
        onChange={(e) => setBreakdown(e.target.checked)}
        className="accent-navy"
      />
      Split by severity
    </label>
  );

  return (
    <Card title="Events by algorithm" action={toggle}>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={!data || data.length === 0}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="algorithm" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#1a2b3d0a" }} />
              {breakdown ? (
                <>
                  <Legend />
                  {SEVERITIES.map((severity) => (
                    <Bar
                      key={severity}
                      dataKey={severity}
                      name={severity}
                      stackId="severity"
                      fill={SEVERITY_COLORS[severity]}
                    />
                  ))}
                </>
              ) : (
                <Bar dataKey="count" name="Events" fill={ACCENT_COLOR} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </QueryState>
    </Card>
  );
}
