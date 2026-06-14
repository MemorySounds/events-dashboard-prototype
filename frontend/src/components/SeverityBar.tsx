// A compact horizontal stacked bar showing how an IP's events split by severity,
// plus the per-severity counts (which double as an inline legend). Reuses the
// shared severity palette so it reads the same as the charts.

import type { Severity } from "@/lib/api";
import { SEVERITIES } from "@/lib/api";
import { SEVERITY_COLORS } from "@/lib/colors";

interface SeverityBarProps {
  bySeverity: Record<Severity, number>;
  total: number;
}

export function SeverityBar({ bySeverity, total }: SeverityBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-2.5 w-40 overflow-hidden rounded-full bg-gray-100">
        {SEVERITIES.map((severity) => {
          const count = bySeverity[severity];
          if (!count) return null;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div
              key={severity}
              style={{ width: `${pct}%`, backgroundColor: SEVERITY_COLORS[severity] }}
              title={`${severity}: ${count}`}
            />
          );
        })}
      </div>
      <div className="flex gap-2 text-xs text-gray-500">
        {SEVERITIES.map((severity) => (
          <span key={severity} className="inline-flex items-center gap-1" title={severity}>
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: SEVERITY_COLORS[severity] }}
            />
            {bySeverity[severity]}
          </span>
        ))}
      </div>
    </div>
  );
}
