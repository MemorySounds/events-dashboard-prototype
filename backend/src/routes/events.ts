import { Router } from "express";
import { z } from "zod";
import { eventFilterSchema, fromBeforeTo, fromBeforeToError } from "../schemas";
import { listEvents } from "../services/events";
import { buildPagination } from "../lib/pagination";

const router = Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Shared filters + pagination, coerced from string query params. Invalid input → 400.
const QuerySchema = eventFilterSchema
  .extend({
    limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine(fromBeforeTo, fromBeforeToError);

// GET /events — paginated, filterable list, newest first.
router.get("/", async (req, res) => {
  const { limit, offset, ...filters } = QuerySchema.parse(req.query);
  const { data, total } = await listEvents(filters, { limit, offset });
  res.json({ data, pagination: buildPagination(total, limit, offset) });
});

export default router;
