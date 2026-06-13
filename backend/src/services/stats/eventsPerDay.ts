import { prisma } from "../../db/client";
import { Prisma } from "../../generated/prisma/client";
import type { EventFilters } from "../../schemas";

// Raw-SQL WHERE for the standard filters — local to this endpoint (the only $queryRaw
// one using the standard filter set). Parameterized (values bound) → injection-safe.
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
