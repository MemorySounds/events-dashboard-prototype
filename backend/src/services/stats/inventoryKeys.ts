import { prisma } from "../../db/client";
import { Prisma } from "../../generated/prisma/client";
import type { InventoryFilters } from "../../schemas";

// Raw-SQL WHERE for inventory-keys' bespoke filter set: equality on assetType/severity,
// IN on the algorithm list, and a year expanded to a [Jan 1, next Jan 1) UTC range.
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

// Key inventory: counts of UNIQUE assets per algorithm × asset type, with the bespoke
// filter set (asset type, severity, year, algorithm list). Uses COUNT(DISTINCT "assetId")
// so an asset that fired many events is counted once — needs $queryRaw, since Prisma's
// groupBy._count can't express a DISTINCT on a different column.
export function inventoryKeys(filters: InventoryFilters): Promise<InventoryRow[]> {
  return prisma.$queryRaw<InventoryRow[]>`
    SELECT "algorithm", "assetType", COUNT(DISTINCT "assetId")::int AS count
    FROM events
    ${buildInventoryWhereSql(filters)}
    GROUP BY "algorithm", "assetType"
    ORDER BY "algorithm" ASC, "assetType" ASC
  `;
}
