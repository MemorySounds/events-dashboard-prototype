-- DropIndex
DROP INDEX "events_algorithm_idx";

-- DropIndex
DROP INDEX "events_assetType_idx";

-- DropIndex
DROP INDEX "events_observedAt_severity_idx";

-- DropIndex
DROP INDEX "events_severity_idx";

-- DropIndex
DROP INDEX "events_sourceIp_idx";

-- CreateIndex
CREATE INDEX "events_algorithm_observedAt_idx" ON "events"("algorithm", "observedAt");

-- CreateIndex (partial; hand-written — Prisma can't express partial indexes).
-- Indexes only the deprecated-algorithm rows, time-ordered, for the weak-signal
-- "recent SHA1/3DES usage" query. Tiny vs a full index since these rows are rare.
CREATE INDEX "events_weak_algorithm_recent_idx" ON "events"("observedAt")
  WHERE "algorithm" IN ('SHA1', '3DES');
