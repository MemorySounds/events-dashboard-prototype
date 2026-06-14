// A coloured pill for a severity value, using the shared severity palette so it
// matches the charts. Reused by the events table and the top-IPs view.

import type { Severity } from "@/lib/api";
import { SEVERITY_COLORS } from "@/lib/colors";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity];
  return (
    <span
      className="inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize"
      // Tint the text/border with the severity colour; a faint matching fill via low-alpha hex.
      style={{ color, borderColor: color, backgroundColor: `${color}14` }}
    >
      {severity}
    </span>
  );
}
