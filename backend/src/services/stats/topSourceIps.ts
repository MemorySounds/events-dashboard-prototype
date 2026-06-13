import { prisma } from "../../db/client";
import { buildWhere, type EventFilters } from "../../schemas";

type Severity = "info" | "warning" | "critical";

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
