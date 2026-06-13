import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Prisma 7 requires a driver adapter; it reads the connection URL from here, not the schema.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// In dev, `tsx watch` reloads this file on every save; a new PrismaClient each time
// would leak DB connections. globalThis survives reloads, so we cache and reuse one.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
