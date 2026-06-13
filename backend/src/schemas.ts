import { z } from "zod";

// Categorical event fields — single source of truth, reused by route validation and the seed.
export const assetTypeEnum = z.enum(["certificate", "ssh-key", "api-key"]);
export const algorithmEnum = z.enum([
  "RSA2048",
  "RSA1024",
  "ECDSA-P256",
  "Ed25519",
  "SHA1",
  "3DES",
]);
export const severityEnum = z.enum(["info", "warning", "critical"]);
export const eventTypeEnum = z.enum([
  "observed",
  "rotation",
  "expiration-warning",
  "error",
]);

// Shared by every endpoint (list + stats). Each route adds its own
// fields on top (e.g. pagination) and applies the from/to date check itself.
export const eventFilterSchema = z.object({
  assetType: assetTypeEnum.optional(),
  algorithm: algorithmEnum.optional(),
  severity: severityEnum.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type EventFilters = z.infer<typeof eventFilterSchema>;

// Cross-field rule for `.refine()`: when both bounds are set, `from` must not be after `to`.
export const fromBeforeTo = (q: { from?: Date | undefined; to?: Date | undefined }) =>
  !q.from || !q.to || q.from <= q.to;

export const fromBeforeToError = {
  message: "`from` must be on or before `to`",
  path: ["from"],
};

// Build a Prisma `where` from only the supplied filters; shared by the list and stats services.
export function buildWhere(filters: EventFilters) {
  const { assetType, algorithm, severity, from, to } = filters;
  return {
    ...(assetType && { assetType }),
    ...(algorithm && { algorithm }),
    ...(severity && { severity }),
    ...((from || to) && {
      observedAt: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    }),
  };
}

// inventory-keys takes a richer, bespoke filter set (per the brief): asset type and
// severity (reused from above), an algorithm *list* (IN), and a calendar year.
export const inventoryFilterSchema = eventFilterSchema
  .pick({ assetType: true, severity: true })
  .extend({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    // `?algorithms=RSA1024,SHA1,3DES` → validated array; each must be a known algorithm.
    algorithms: z
      .string()
      .transform((s) => s.split(",").filter(Boolean))
      .pipe(z.array(algorithmEnum))
      .optional(),
  });

export type InventoryFilters = z.infer<typeof inventoryFilterSchema>;
