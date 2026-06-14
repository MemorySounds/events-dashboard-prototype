// Small display formatters shared across tables.

// Render an ISO timestamp as a compact, locale-aware date-time.
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Parse a "YYYY-MM-DD" day string into a *local* date (no UTC parsing), so
// formatting can't shift it to the neighbouring day in some timezones.
function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Compact axis label, e.g. "Mar 15" — with a 2-digit year ("Mar 15 '26") only
// when a chart spans multiple years, so single-year axes stay uncluttered.
export function formatDayShort(day: string, withYear = false): string {
  const date = parseDay(day);
  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return withYear ? `${label} '${day.slice(2, 4)}` : label;
}

// Full day label for tooltips, e.g. "15 Mar 2026".
export function formatDayLong(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
