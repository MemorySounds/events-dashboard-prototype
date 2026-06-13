import { prisma } from "../../db/client";
import type { EventFilters } from "../../schemas";
import { buildWhereSql } from "./sql";

type Severity = "info" | "warning" | "critical";

export interface TopIp {
  sourceIp: string;
  total: number;
  bySeverity: Record<Severity, number>;
}

interface Row {
  sourceIp: string;
  total: number;
  info: number;
  warning: number;
  critical: number;
}

// Busiest source IPs with a per-severity breakdown. The database does all the work:
// COUNT(*) FILTER pivots each severity into its own column, and ORDER BY + LIMIT applies
// the top-N — so only `limit` rows come back. JS only nests the columns into bySeverity.
export async function topSourceIps(filters: EventFilters, limit: number): Promise<TopIp[]> {
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT "sourceIp",
           COUNT(*)::int AS total,
           (COUNT(*) FILTER (WHERE "severity" = 'info'))::int     AS info,
           (COUNT(*) FILTER (WHERE "severity" = 'warning'))::int  AS warning,
           (COUNT(*) FILTER (WHERE "severity" = 'critical'))::int AS critical
    FROM events
    ${buildWhereSql(filters)}
    GROUP BY "sourceIp"
    ORDER BY total DESC, "sourceIp" ASC
    LIMIT ${limit}
  `;

  console.log({rows});

  // Nest the flat severity columns into bySeverity — a rename, not aggregation.
  const rowsMapped = rows.map((r) => ({
    sourceIp: r.sourceIp,
    total: r.total,
    bySeverity: { info: r.info, warning: r.warning, critical: r.critical },
  }));

  console.log({rowsMapped});
  return rowsMapped;
}
