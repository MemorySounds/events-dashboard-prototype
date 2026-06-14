-- DropIndex: the general (algorithm, observedAt) composite is redundant — common
-- algorithms ride the observedAt index; selective filters only hit deprecated ones.
DROP INDEX "events_algorithm_observedAt_idx";

-- Widen the partial index to cover ALL deprecated algorithms (1024-bit RSA is weak
-- too), then it fully covers every selective algorithm filter the product makes.
-- Drop + recreate, since a partial index's predicate can't be altered in place.
DROP INDEX "events_weak_algorithm_recent_idx";
CREATE INDEX "events_weak_algorithm_recent_idx" ON "events"("observedAt")
  WHERE "algorithm" IN ('RSA1024', 'SHA1', '3DES');
