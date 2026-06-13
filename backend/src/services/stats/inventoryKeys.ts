import { prisma } from "../../db/client";
import { Prisma } from "../../generated/prisma/client";
import type { InventoryFilters } from "../../schemas";

// Parameterized WHERE for the bespoke filters; year expands to a [Jan 1, next Jan 1) UTC range.
function buildInventoryWhereSql(f: InventoryFilters): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  if (f.assetType) conditions.push(Prisma.sql`"assetType" = ${f.assetType}`);
  if (f.severity) conditions.push(Prisma.sql`"severity" = ${f.severity}`);
  if (f.algorithms?.length) conditions.push(Prisma.sql`"algorithm" IN (${Prisma.join(f.algorithms)})`);
  if (f.year) {
    conditions.push(
      Prisma.sql`"observedAt" >= ${new Date(Date.UTC(f.year, 0, 1))} AND "observedAt" < ${new Date(Date.UTC(f.year + 1, 0, 1))}`,
    );
  }
  return conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;
}

export interface InventoryRow {
  algorithm: string;
  assetType: string;
  count: number;
}

// COUNT(DISTINCT "assetId") → unique assets, not events (one asset emits many events).
// Needs $queryRaw: groupBy._count can't do DISTINCT on another column.
export function inventoryKeys(filters: InventoryFilters): Promise<InventoryRow[]> {
  return prisma.$queryRaw<InventoryRow[]>`
    SELECT "algorithm", "assetType", COUNT(DISTINCT "assetId")::int AS count
    FROM events
    ${buildInventoryWhereSql(filters)}
    GROUP BY "algorithm", "assetType"
    ORDER BY "algorithm" ASC, "assetType" ASC
  `;
}
