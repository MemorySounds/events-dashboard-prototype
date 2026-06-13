import { prisma } from "../../db/client";
import type { EventFilters } from "../../schemas";
import { buildWhereSql } from "./sql";

export interface DayCount {
  day: string;
  count: number;
}

// Raw SQL: grouping is on a computed expression (date_trunc) that groupBy can't express.
// COUNT(*)::int avoids a bigint that won't JSON-serialize.
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
