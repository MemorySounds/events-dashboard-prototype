import { prisma } from "../db/client";
import { buildWhere, type EventFilters } from "../schemas";

export interface PageParams {
  limit: number;
  offset: number;
}

// List matching events (newest first) with the total count; page + count run in parallel.
export async function listEvents(filters: EventFilters, { limit, offset }: PageParams) {
  const where = buildWhere(filters);

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { observedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.event.count({ where }),
  ]);

  return { data, total };
}
