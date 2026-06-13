import { prisma } from "../../db/client";
import { buildWhere, type EventFilters } from "../../schemas";

// Counts per algorithm, optionally split by severity. Typed groupBy reuses buildWhere.
// Two branches (not a dynamic `by`) so each result shape is known to the compiler.
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
