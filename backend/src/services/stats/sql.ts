import { Prisma } from "../../generated/prisma/client";
import type { EventFilters } from "../../schemas";

// Parameterized WHERE fragment for the standard filters — values are bound, not
// interpolated (injection-safe). Shared by the $queryRaw stats endpoints.
export function buildWhereSql(filters: EventFilters): Prisma.Sql {
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
