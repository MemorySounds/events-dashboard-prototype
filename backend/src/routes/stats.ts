import { Router } from "express";
import { z } from "zod";
import {
  eventFilterSchema,
  inventoryFilterSchema,
  fromBeforeTo,
  fromBeforeToError,
} from "../schemas";
import {
  eventsPerDay,
  byAlgorithm,
  inventoryKeys,
  topSourceIps,
} from "../services/stats";

const router = Router();

// Query-string booleans: z.coerce.boolean() is unsafe here (Boolean("false") === true),
// so accept the literal strings and map them.
const boolParam = z.enum(["true", "false"]).default("false").transform((v) => v === "true");

const DEFAULT_TOP = 10;
const MAX_TOP = 50;

// Every stats endpoint is filter-aware via the shared schema + from/to check.
const FilterSchema = eventFilterSchema.refine(fromBeforeTo, fromBeforeToError);

// GET /stats/events-per-day — event volume bucketed by day.
router.get("/events-per-day", async (req, res) => {
  const filters = FilterSchema.parse(req.query);
  res.json({ data: await eventsPerDay(filters) });
});

// GET /stats/by-algorithm — counts per algorithm, optional severity breakdown.
router.get("/by-algorithm", async (req, res) => {
  const { breakdownBySeverity, ...filters } = eventFilterSchema
    .extend({ breakdownBySeverity: boolParam })
    .refine(fromBeforeTo, fromBeforeToError)
    .parse(req.query);
  res.json({ data: await byAlgorithm(filters, breakdownBySeverity) });
});

// GET /stats/inventory-keys — counts per algorithm × asset type, filtered by
// asset type, severity, year, and an algorithm list (the brief's multi-filter query).
router.get("/inventory-keys", async (req, res) => {
  const filters = inventoryFilterSchema.parse(req.query);
  res.json({ data: await inventoryKeys(filters) });
});

// GET /stats/top-source-ips — busiest IPs with a per-severity breakdown.
router.get("/top-source-ips", async (req, res) => {
  const { limit, ...filters } = eventFilterSchema
    .extend({ limit: z.coerce.number().int().min(1).max(MAX_TOP).default(DEFAULT_TOP) })
    .refine(fromBeforeTo, fromBeforeToError)
    .parse(req.query);
  res.json({ data: await topSourceIps(filters, limit) });
});

export default router;
