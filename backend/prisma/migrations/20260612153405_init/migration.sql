-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "sourceIp" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_observedAt_idx" ON "events"("observedAt");

-- CreateIndex
CREATE INDEX "events_algorithm_idx" ON "events"("algorithm");

-- CreateIndex
CREATE INDEX "events_severity_idx" ON "events"("severity");

-- CreateIndex
CREATE INDEX "events_assetType_idx" ON "events"("assetType");

-- CreateIndex
CREATE INDEX "events_sourceIp_idx" ON "events"("sourceIp");

-- CreateIndex
CREATE INDEX "events_observedAt_severity_idx" ON "events"("observedAt", "severity");
