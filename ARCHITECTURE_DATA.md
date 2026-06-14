# Architecture & Data

How the events dataset is modeled, queried, secured, and how it would
evolve under scale.

---

## 1. Data Model & Indexing

A single, flat, denormalized `events` table. Each row is one immutable
observation — "this algorithm was seen on this asset, from this IP, at this time."

| Column | Type | Notes |
|---|---|---|
| `id` | `text` (cuid) | Primary key |
| `assetId` | `text` | The asset the event concerns |
| `assetType` | `text` | `certificate` \| `ssh-key` \| `api-key` |
| `algorithm` | `text` | `RSA2048` \| `RSA1024` \| `ECDSA-P256` \| `Ed25519` \| `SHA1` \| `3DES` |
| `severity` | `text` | `info` \| `warning` \| `critical` |
| `sourceIp` | `text` | Origin of the observation |
| `observedAt` | `timestamptz` | When the event occurred |
| `eventType` | `text` | `observed` \| `rotation` \| `expiration-warning` \| `error` |

**Why flat/denormalized.** Events are append-only telemetry, and the workload
*aggregates* (GROUP BY, COUNT) rather than joins. A flat table scans and groups
faster than a normalized schema and avoids join overhead on every query.
Normalization would buy write-side integrity we don't need for an immutable stream.

**Why these types.** Categorical fields are stored as `text` and validated with
Zod enums at the API boundary, rather than Postgres `enum` types — adding a new
algorithm is a code change, not a database migration. `id` is a `cuid`:
collision-resistant and roughly time-sortable, with no central coordination.

**Indexing — two purposeful indexes.** An index only pays off when a filter
selects a *small* slice of rows, so we don't index every column. Two carry the load:

- **`observedAt`** — the workhorse: backs the date-range filter,
  `ORDER BY observedAt DESC`, and day-grouping. Common algorithms are dense, so
  filtering by one rides this index directly — no separate algorithm index needed.
- **Partial index on deprecated algorithms** —
  `observedAt WHERE algorithm IN ('RSA1024','SHA1','3DES')`. A *selective* algorithm
  filter only ever targets weak/deprecated crypto — the brief's "weak signals" — so
  we index exactly those rows, time-ordered, and nothing else. It's tiny (those rows
  are rare) and points the storage straight at the product's purpose.

`severity` and `assetType` have only three values each, so filtering on one still
matches about a third of the table — too many rows for an index to help. Postgres
just scans and checks the column as it goes, so we don't index them.

Two notes: the partial index is raw SQL in a migration because Prisma can't express
one; and at the seed's 50 rows none of this is exercised yet (Postgres scans the
whole table regardless) — the strategy is forward-looking, to confirm with
`EXPLAIN ANALYZE` at real volume.

---

## 2. Aggregation Approach & Scalability

**Two query styles, by endpoint shape:**

- **List (`GET /events`)** returns rows → Prisma's typed `findMany` with a
  dynamic `where`, ordered and paginated.
- **Stats (`/stats/*`)** return aggregated buckets → `GROUP BY` runs **in the
  database**, never by pulling rows into JS and counting. Aggregation belongs
  where the data and indexes are.

**Filter-aware everywhere.** List and stats endpoints accept the same filter set
(`assetType`, `algorithm`, `severity`, `from`, `to`) via a shared `buildWhere()`
helper, so a filtered table and a filtered chart narrow the data identically.

**Counting semantics (`inventory-keys`).** The data is an event *stream* of
**persistent assets** — each `assetId` emits many events over its lifetime. So an
*inventory* must count **unique assets**, not events: it uses
`COUNT(DISTINCT assetId)` (sample data: 50 events → 20 assets).

**`groupBy` vs raw SQL.** Only `by-algorithm` groups on plain stored columns, so it
uses Prisma's typed `groupBy`. The other three need raw `$queryRaw` because their
aggregation is something `groupBy` can't express: `events-per-day` groups on a
computed `date_trunc('day', …)`; `inventory-keys` needs `COUNT(DISTINCT assetId)`;
`top-source-ips` uses a `COUNT(*) FILTER (WHERE severity = …)` pivot. All are still
parameterized — no user input is interpolated into SQL.

**Scaling the aggregation:**

- **Pre-aggregate** once per-request GROUP BY gets slow — materialized views or
  summary tables for the stats endpoints, refreshed on a schedule or incrementally.
- **Change the storage engine** at 10M+ rows — time-partition by `observedAt`
  (native Postgres partitioning) or move to a time-series / columnar store
  (TimescaleDB, ClickHouse) built for aggregate scans.

---

## 3. Performance & Future Evolution

**Implemented:**

- Indexes aligned to the actual filter/sort/group columns (§1).
- A `LIMIT` on every list query, with a `MAX_LIMIT` cap so a client can't request
  an unbounded page.
- The page query and the total `count` run **concurrently** (`Promise.all`), so
  list latency is ~one query, not two, while keeping Prisma's typed, injection-safe API.

**Complexity reality.** Every aggregation must read **all matching rows** to count
them, so each is **linear (Θ(N))** in the number of matching events, regardless of
indexing. Indexes shrink *N itself* (fewer rows visited) and let the list endpoint
read in sort order — they don't change the aggregate's linear pass. Two
consequences worth calling out:

- **`OFFSET` degrades on deep pages** — `/events?offset=P` scans and discards `P`
  rows. This is why cursor (keyset) pagination is the scale path.
- **`LIMIT` doesn't cut aggregation cost** — `top-source-ips` still groups *all*
  IPs before `ORDER BY … LIMIT`; you can't limit before aggregating.

**Future — high volume & streaming:**

- **Ingestion:** replace the batch seed with a streaming ingest (Kafka / NATS) and
  a consumer writing to the table.
- **Real-time:** push updates to the dashboard over SSE/WebSockets instead of
  fetch-on-load.
- **Pagination:** switch `/events` from `OFFSET` to **cursor-based** keyset on
  `(observedAt, id)` — stable under inserts and cheap on deep pages.

---

## 4. Security & Multi-Tenancy

**Implemented:**

- **No SQL injection surface** — all queries go through Prisma (parameterized);
  the few raw aggregations use parameterized `$queryRaw` with no string
  interpolation of user input.
- **Validated at the boundary** — every query param is parsed by Zod with enum
  allow-lists, so invalid input is rejected with `400` before reaching the
  database (e.g. `algorithm` can only ever be a known value).
- **No internals leaked** — the error handler returns a generic message on `500`
  and logs detail server-side only.

**To harden for production:** rate-limiting on stats endpoints, JWT auth, and
tightening CORS from the permissive dev setting.

**Multi-tenancy strategy:**

- Add a `tenantId` column, index it, and prefix composite indexes with it.
- Enforce isolation with a **middleware-injected filter** so every query is
  automatically scoped to the caller's tenant — never rely on each route to
  remember `WHERE tenantId = …`.
- Add Postgres **Row-Level Security** as a defense-in-depth backstop.

---

## 5. What I'd Improve With Two Extra Days

- **Streaming ingest** (Kafka/NATS) + **real-time** dashboard updates over SSE.
- **Auth (JWT) and per-tenant scoping** wired end to end.
- **Materialized views** for the stats endpoints, with a refresh strategy.
- **Test suite** — unit tests for the aggregation queries and pagination math, an
  integration test per endpoint — and **CI** running migrations + tests on PRs.
- **Observability** — request logging, slow-query logging, basic metrics.
- **Saved filter presets (frontend).** Filters live in the URL (shareable, survive
  refresh); cross-session persistence was a deliberate non-goal (not shareable,
  risks stale state). A nicer future option is opt-in named presets, still URL-driven.
