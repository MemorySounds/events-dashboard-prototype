// Shared severity colours, used by every chart and breakdown so a given
// severity reads the same everywhere (critical = red, etc.). Keyed by the
// Severity union so adding a severity is a compile error until coloured.

import type { Severity } from "./api";

export const SEVERITY_COLORS: Record<Severity, string> = {
  info: "#3b82f6", // blue-500
  warning: "#f59e0b", // amber-500
  critical: "#ef4444", // red-500
};

// A single accent colour for non-severity-split charts (brand data-viz blue).
export const ACCENT_COLOR = "#1f3a5f"; // --color-brand-blue
