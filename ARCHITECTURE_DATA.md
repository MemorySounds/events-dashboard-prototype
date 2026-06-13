# Architecture & Data

How the crypto-events dataset is modeled, queried, and how the design would evolve under scale.

> **How to read this doc:** notes marked **_Decided_** reflect what's implemented today; **_TODO_** marks sections to expand as the app is built and tidied at the end.

---

## 1. Data Model & Indexing Strategy

### Model

A single, flat, denormalized `events` table. Each row is one immutable observation — "this algorithm was seen on this asset, from this IP, at this time."

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

**_Decided — why flat/denormalized:_** events are append-only telemetry, and analytics workloads aggregate (GROUP BY, COUNT) rather than join. A flat table scans and groups faster than a normalized schema, and avoids join overhead on every query. Normalization would buy write-side integrity we don't need for an immutable event stream.

> **TODO:** note the choice of `cuid` for the id (collision-resistant, sortable-ish, no coordination) vs `uuid`/serial. Mention enums are modeled as `text` + Zod-validated at the API boundary rather than Postgres `enum` types — why (cheaper schema evolution; see §4).

### Indexing strategy

**_Decided — principle:_** index every column used in a `WHERE`, `ORDER BY`, or `GROUP BY`. Current indexes:

- Single-column: `observedAt`, `algorithm`, `severity`, `assetType`, `sourceIp` — each backs a filter or grouping.
- Composite: `(observedAt, severity)` — for the common "recent + critical" access pattern.

> **TODO:** as endpoints are finalized, justify each composite index against the actual query that uses it (column order matters: most-selective / range-last). Note any index that turns out unused and could be dropped.

---

## 2. Aggregation Approach & Scalability

### Approach

**_Decided — two query styles, by endpoint shape:_**

- **List endpoint (`GET /events`)** returns individual rows → Prisma's typed `findMany` with a dynamic `where`, ordered and paginated.
- **Stats endpoints (`/stats/*`)** return aggregated buckets → `GROUP BY` executed **in the database** (via Prisma `$queryRaw`), never by pulling rows into JS and counting. Aggregation belongs where the data and indexes are.

**_Decided — filter-aware stats:_** every endpoint (list and stats) accepts the same filter set (`assetType`, `algorithm`, `severity`, `from`, `to`) via a shared `buildWhere()` helper, so a filtered list and a filtered chart narrow the dataset identically.

> **TODO:** for each stats endpoint, record the query as built:
> - `/stats/events-per-day` — `date_trunc` + GROUP BY day.
> - `/stats/by-algorithm` — GROUP BY algorithm (+ severity when `breakdownBySeverity`).
> - `/stats/inventory-keys` — multi-filter composite.
> - `/stats/top-source-ips` — GROUP BY source_ip, ORDER BY count DESC, top-N.

> **_Decided — counting semantics (inventory-keys):_** the data is an append-only event
> *stream*, and the seed models a fixed pool of **persistent assets** — each `assetId` has
> a stable `assetType` + `algorithm` and emits many events over its lifetime (`observed`,
> `rotation`, `expiration-warning`, …). Because one asset spans many rows, an *inventory*
> must count **unique assets**, not events: `inventory-keys` uses `COUNT(DISTINCT "assetId")`
> (sample data: 50 events → 20 assets). This is the one stats endpoint on `$queryRaw`, since
> Prisma's `groupBy._count` can't express a `DISTINCT` on a different column; the other three
> group by stored columns and stay on the typed `groupBy` API.

### Scalability considerations

> **TODO:** expand. Skeleton:
> - **Pre-aggregation:** materialized views or summary tables for the stats endpoints once raw volume makes per-request GROUP BY too slow; refresh on a schedule or incrementally.
> - **Storage engine:** at 10M+ rows, time-partition the table (native Postgres partitioning by `observedAt`) or move to a time-series/columnar store (TimescaleDB hypertable, ClickHouse) better suited to aggregate scans.

---

## 3. Performance Optimizations & Future Evolution

### Current optimizations

**_Decided:_**
- Composite + single-column indexes aligned to the actual filter/sort/group columns (§1).
- A `LIMIT` on every list query; `MAX_LIMIT` cap so a client can't request an unbounded page.
- **Pagination counts run in parallel:** the page query (`findMany`) and the total `count` fire concurrently via `Promise.all`, so latency is ~one query, not two — while keeping Prisma's typed, injection-safe API.

> **_Decided — note (pagination, one-query alternative):_** total + page could instead be a single query using a SQL window function (`SELECT *, COUNT(*) OVER() AS total ... LIMIT/OFFSET`), saving a round-trip and guaranteeing both come from the same snapshot. Deliberately **not** adopted: it requires raw SQL (losing Prisma's types) and the round-trip/consistency wins are negligible at this scale with append-only data. Revisit for a hot endpoint at high volume.

> **TODO:** add `EXPLAIN ANALYZE` sanity checks on the heavier stats queries; record whether indexes are actually used.

### Query complexity

Notation: **N** = events matching the filter; **L** = page/top-N limit, **P** = offset;
**D** = distinct days, **G** = distinct groups (algorithm[/severity] or algorithm×assetType,
≤ ~18), **I** = distinct source IPs, **U** = distinct matching assets. `D, G, I, U ≤ N` and
in practice small.

Key point: every aggregation must read **all matching rows** to count them, so each is **Θ(N)
in time regardless of indexing**. Indexes on the filter columns shrink *N itself* (fewer rows
visited) and let the list endpoint read in sort order — they don't change the aggregate's
linear pass. "Space" below is server-side working set; result size is listed separately.

| Endpoint | Time | Space (server) | Result rows |
|---|---|---|---|
| `GET /events` | O(N) — `count` visits all N matches; page fetch O(P + L) via the `observedAt` index | O(L) | L |
| `GET /stats/events-per-day` | O(N) scan + group; + O(D log D) to order days | O(D) | D |
| `GET /stats/by-algorithm` | O(N) | O(G) | ≤ G |
| `GET /stats/inventory-keys` | O(N) scan + `COUNT(DISTINCT assetId)` per group | O(U) (distinct-id tracking) | ≤ G |
| `GET /stats/top-source-ips` | O(N + I log I) — group, then sort IPs | O(I) | L |

Caveats worth noting:
- **`OFFSET` degrades:** `/events` page cost is O(P + L) — large offsets scan-and-discard P rows. This is the reason cursor pagination is the scale path (below).
- **`LIMIT` doesn't cut aggregation cost:** `top-source-ips` still groups **all** I IPs before `ORDER BY … LIMIT`, so server work/space stays O(I) even when L is tiny — you can't limit before aggregating.
- **App-layer post-processing is negligible:** `by-algorithm` / `top-source-ips` map over G / L result rows (O(G) / O(L)); the others return the query result directly.

### Future evolution — high volume & streaming

> **TODO:** expand. Skeleton:
> - **Ingestion:** move from batch seed to a streaming ingest (Kafka / NATS) with a consumer writing to the table.
> - **Real-time dashboard:** push updates to the frontend via SSE/WebSockets instead of poll-on-refresh.
> - **Pagination at scale:** switch list pagination from `OFFSET` to **cursor-based** (keyset on `observedAt`/`id`) — `OFFSET` degrades on deep pages and can skip/repeat rows under inserts.

---

## 4. Security Considerations & Multi-Tenancy

### Security

**_Decided:_**
- **No SQL injection surface:** all queries go through Prisma (parameterized); the few raw aggregations use parameterized `$queryRaw` with no string interpolation of user input.
- **Validated at the boundary:** every query param is parsed by Zod with enum allow-lists — invalid input is rejected with a `400` before it reaches the database, so e.g. `algorithm` can only ever be one of the known values.
- **No internals leaked:** the error handler returns a generic message on `500` and logs the detail server-side only.

> **TODO:** expand — rate limiting on stats endpoints; auth (JWT) for non-public deployment; CORS tightening from the current permissive dev setting.

### Multi-tenancy strategy

> **TODO:** expand. Skeleton:
> - Add a `tenantId` column + index it (and prefix composite indexes with it).
> - Enforce isolation with a **middleware-injected filter** so every query is automatically scoped to the caller's tenant — never rely on the route author to remember the `WHERE tenantId = ...`.
> - Consider Postgres Row-Level Security as a defense-in-depth backstop.

---

## 5. What I'd Improve With Two Extra Days

> **TODO:** finalize at the end. Candidate list:
> - Streaming ingest (Kafka/NATS) + real-time dashboard updates over SSE.
> - Proper auth (JWT) and per-tenant scoping wired end-to-end.
> - Materialized views / summary tables for the stats endpoints, with a refresh strategy.
> - A test suite: unit tests for the aggregation queries + pagination math, an integration test per endpoint.
> - CI: run migrations + tests on PRs; `EXPLAIN`-based query regression checks.
> - Observability: request logging, slow-query logging, basic metrics.
