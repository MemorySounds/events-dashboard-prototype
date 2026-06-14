# Backend API image. Single stage: the container also runs migrations + the seed
# on start, which need the Prisma CLI and tsx (dev deps), so we keep full deps.
FROM node:22-slim

# OpenSSL + CA certs: Prisma CLI (migrate) expects them present.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for layer caching.
COPY package*.json ./
RUN npm ci

# App source (prisma schema/config/seed + src). .dockerignore keeps out node_modules,
# dist, the generated client, and .env so the image stays clean and uses runtime env.
COPY . .

# Generate the Prisma client into src/generated, then compile TS → dist.
# prisma.config.ts resolves env("DATABASE_URL") at load time, so a throwaway value
# is needed here — `generate` never connects; the real URL is injected at runtime.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
  npx prisma generate && npm run build

EXPOSE 3001

# On start: apply migrations (idempotent), seed (idempotent — clears then re-ingests),
# then launch the compiled server. DATABASE_URL/PORT come from the environment.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/index.js"]
