// Shared custom tooltip for the dashboard charts. Recharts' default styles the
// label and values almost identically; this gives a clear hierarchy — a bold,
// divided header (the date / algorithm) above dimmed rows with colour dots and
// right-aligned values.

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  // Injected by Recharts when used via <Tooltip content={<ChartTooltip />} />.
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  // Optional formatter for the header label (e.g. format a day string).
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({ active, payload, label, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const heading = labelFormatter ? labelFormatter(String(label)) : String(label);

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1.5 border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-navy">
        {heading}
      </p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey ?? entry.name}
            className="flex items-center justify-between gap-6 text-xs"
          >
            <span className="flex items-center gap-1.5 capitalize text-gray-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
