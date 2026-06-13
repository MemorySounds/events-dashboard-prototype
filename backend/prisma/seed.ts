import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Prisma 7 requires a driver adapter; the runtime client reads its URL from here, not the schema.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Validate every line of the event stream on ingest — same enum constraints the API enforces.
const EventSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  assetType: z.enum(["certificate", "ssh-key", "api-key"]),
  algorithm: z.enum(["RSA2048", "RSA1024", "ECDSA-P256", "Ed25519", "SHA1", "3DES"]),
  severity: z.enum(["info", "warning", "critical"]),
  sourceIp: z.string(),
  observedAt: z.coerce.date(),
  eventType: z.enum(["observed", "rotation", "expiration-warning", "error"]),
});

async function main() {
  const file = join(__dirname, "events.ndjson");
  const lines = readFileSync(file, "utf-8")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const events = lines.map((line, i) => {
    const parsed = EventSchema.safeParse(JSON.parse(line));
    if (!parsed.success) {
      throw new Error(`Invalid event on line ${i + 1}: ${parsed.error.message}`);
    }
    return parsed.data;
  });

  // Idempotent: clear then re-ingest, so re-running the seed is safe.
  await prisma.event.deleteMany();
  const result = await prisma.event.createMany({ data: events, skipDuplicates: true });

  console.log(`Seeded ${result.count} events from ${events.length} validated lines.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
