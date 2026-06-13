import { prisma } from "../db/client";
import { Prisma } from "../generated/prisma/client";
import {
  buildWhere,
  buildInventoryWhere,
  type EventFilters,
  type InventoryFilters,
} from "../schemas";

type Severity = "info" | "warning" | "critical";

// Raw-SQL counterpart to buildWhere, for the one endpoint that needs $queryRaw.
// Each fragment is parameterized (values bound, not interpolated) → injection-safe.
function buildWhereSql(filters: EventFilters): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  if (filters.assetType) conditions.push(Prisma.sql`"assetType" = ${filters.assetType}`);
  if (filters.algorithm) conditions.push(Prisma.sql`"algorithm" = ${filters.algorithm}`);
  if (filters.severity) conditions.push(Prisma.sql`"severity" = ${filters.severity}`);
  if (filters.from) conditions.push(Prisma.sql`"observedAt" >= ${filters.from}`);
  if (filters.to) conditions.push(Prisma.sql`"observedAt" <= ${filters.to}`);
  return conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;
}

export interface DayCount {
  day: string;
  count: number;
}

// Events bucketed by calendar day. Needs raw SQL because grouping is on a computed
// expression (date_trunc), which Prisma's groupBy can't express. COUNT(*)::int keeps
// the result a JS number (a bare COUNT returns bigint, which won't JSON-serialize).
export function eventsPerDay(filters: EventFilters): Promise<DayCount[]> {
  return prisma.$queryRaw<DayCount[]>`
    SELECT to_char(date_trunc('day', "observedAt"), 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS count
    FROM events
    ${buildWhereSql(filters)}
    GROUP BY day
    ORDER BY day ASC
  `;
}

// Counts per algorithm, optionally split by severity. Typed groupBy reuses buildWhere.
export async function byAlgorithm(filters: EventFilters, breakdownBySeverity: boolean) {
  const where = buildWhere(filters);

  if (breakdownBySeverity) {
    const rows = await prisma.event.groupBy({
      by: ["algorithm", "severity"],
      where,
      _count: { _all: true },
      orderBy: [{ algorithm: "asc" }, { severity: "asc" }],
    });
    return rows.map((r) => ({
      algorithm: r.algorithm,
      severity: r.severity,
      count: r._count._all,
    }));
  }

  const rows = await prisma.event.groupBy({
    by: ["algorithm"],
    where,
    _count: { _all: true },
    orderBy: { algorithm: "asc" },
  });
  return rows.map((r) => ({ algorithm: r.algorithm, count: r._count._all }));
}

// Key inventory: counts per algorithm × asset type, with the bespoke filter set
// (asset type, severity, year, algorithm list).
export async function inventoryKeys(filters: InventoryFilters) {
  const where = buildInventoryWhere(filters);
  const rows = await prisma.event.groupBy({
    by: ["algorithm", "assetType"],
    where,
    _count: { _all: true },
    orderBy: [{ algorithm: "asc" }, { assetType: "asc" }],
  });
  return rows.map((r) => ({
    algorithm: r.algorithm,
    assetType: r.assetType,
    count: r._count._all,
  }));
}

export interface TopIp {
  sourceIp: string;
  total: number;
  bySeverity: Record<Severity, number>;
}

// Busiest source IPs with a per-severity breakdown. Group by (ip, severity), then
// fold into one record per IP. Top-N is applied in JS after folding — fine at this
// scale; at high volume this would be a top-N subquery joined to the breakdown.
export async function topSourceIps(filters: EventFilters, limit: number): Promise<TopIp[]> {
  const where = buildWhere(filters);
  const rows = await prisma.event.groupBy({
    by: ["sourceIp", "severity"],
    where,
    _count: { _all: true },
  });

  const byIp = new Map<string, TopIp>();
  for (const r of rows) {
    let entry = byIp.get(r.sourceIp);
    if (!entry) {
      entry = { sourceIp: r.sourceIp, total: 0, bySeverity: { info: 0, warning: 0, critical: 0 } };
      byIp.set(r.sourceIp, entry);
    }
    const n = r._count._all;
    entry.total += n;
    entry.bySeverity[r.severity as Severity] = n;
  }

  return [...byIp.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}
