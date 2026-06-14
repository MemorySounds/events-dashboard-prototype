"use client";

// Daily event volume as a line chart (GET /stats/events-per-day). Takes the
// global filters as a prop so it refetches whenever the shared filters change.

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEventsPerDay } from "@/hooks/useStats";
import type { GlobalFilters } from "@/lib/filters";
import { ACCENT_COLOR } from "@/lib/colors";
import { formatDayLong, formatDayShort } from "@/lib/format";
import { Card } from "../ui/Card";
import { QueryState } from "../ui/QueryState";
import { ChartTooltip } from "./ChartTooltip";

export function EventsPerDayChart({ filters }: { filters: GlobalFilters }) {
  const { data, isLoading, isError, error } = useEventsPerDay(filters);

  // Only show the year on axis labels when the data actually spans more than one.
  const multiYear = useMemo(
    () => new Set((data ?? []).map((d) => d.day.slice(0, 4))).size > 1,
    [data],
  );

  return (
    <Card title="Events per day">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={!data || data.length === 0}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                tickFormatter={(day: string) => formatDayShort(day, multiYear)}
                minTickGap={24}
                tickMargin={8}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip labelFormatter={formatDayLong} />} />
              <Line
                type="monotone"
                dataKey="count"
                name="Events"
                stroke={ACCENT_COLOR}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </QueryState>
    </Card>
  );
}
