# Events Analytics Dashboard

An analytics dashboard over a stream of cryptographic-asset telemetry events
(certificates, SSH keys, API keys). It surfaces event volume, algorithm usage —
including weak/deprecated algorithms — and source-IP activity, with shared,
filterable views.

## Tech Stack

| Layer    | Choice                                                                 |
| -------- | ---------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind · TanStack Query · Recharts |
| Backend  | Express 5 · TypeScript · Zod · Prisma 7 (`@prisma/adapter-pg`)         |
| Database | PostgreSQL 16                                                          |
| Tooling  | Docker Compose                                                         |

## Quick Start (Docker)

Requires Docker. From the repository root:

```bash
docker compose up --build
```

This builds and starts everything, applies migrations, and seeds the database:

| Service  | URL                     |
| -------- | ----------------------- |
| Frontend | http://localhost:3000   |
| Backend  | http://localhost:3001   |
| Postgres | localhost:5433          |

Open **http://localhost:3000**. Tear down with `docker compose down` (add `-v` to
also drop the seeded data).

## Local Development

Run Postgres in Docker and the apps with hot reload.

```bash
# 1. Database
docker compose up -d db

# 2. Backend  → http://localhost:3001
cd backend
cp .env.example .env
npm install
npm run db:generate   # generate the Prisma client
npm run db:migrate    # apply migrations
npm run db:seed       # load 50 sample events
npm run dev

# 3. Frontend → http://localhost:3000
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Requires Node.js 20+.

## API

All endpoints accept a shared filter set (`assetType`, `algorithm`, `severity`,
`from`, `to`); stats endpoints add their own params.

| Endpoint                     | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| `GET /events`                | Paginated, filterable event list                  |
| `GET /stats/events-per-day`  | Daily event volume                                |
| `GET /stats/by-algorithm`    | Counts per algorithm (optional severity split)    |
| `GET /stats/inventory-keys`  | Unique assets per algorithm × asset type          |
| `GET /stats/top-source-ips`  | Busiest source IPs with a severity breakdown      |

## Frontend Overview

Three filter-aware views — **Dashboard** (charts), **Events** (table), and
**Top IPs**. Global filters live in the URL, so views are shareable and survive a
refresh. A note on the deliberate split: aggregate charts filter **server-side**,
while the events table fetches the filtered set and does search / sort /
pagination **client-side** (as per the requirement in the project brief).

## Design Notes

See [ARCHITECTURE_DATA.md](ARCHITECTURE_DATA.md) for the data model, indexing,
aggregation strategy, query-complexity analysis, and how the design would scale.
