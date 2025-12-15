# SignalOps Architecture

## System Definition

- **Problem**: Ingest, process, and act on high-volume tenant-scoped business events with predictable latency, strong isolation, and billing accuracy.
- **Users**: Dashboard users (per-tenant admins), integrating backends (emit events), platform operators.
- **Events**: Tenant-scoped business signals (`user.signup`, `payment.failed`, etc.) with payload metadata.
- **Why async**: Keeps ingestion fast, adds backpressure, enables retries/DLQ, decouples notifications/rules/billing from request latency.

### High-Level Architecture

- **API Layer (NestJS)**: REST endpoints for ingestion, auth, rules, notifications, billing. Handles validation, idempotency, auth, enqueue.
- **Event Queue (Redis + BullMQ)**: Durable job queue (`events`) plus DLQ. Backoff/retries, job metadata.
- **Workers**: Separate Nest application context executing rule evaluation, notifications, usage increments.
- **Database (PostgreSQL)**: Source of truth for tenants, users, API keys, rules, events, notifications, usage/billing, idempotency keys.
- **Notification providers**: Email/Telegram/WhatsApp adapters behind an interface with retry/backoff at queue layer.
- **Why not microservices**: Single deployable modular monolith avoids premature complexity while preserving async isolation; shared DB keeps consistency simpler.
- **Scale to 100k+/day**: Horizontal API/worker scale; queue backpressure; indexed queries; soft/hard tenant limits; idempotent ingestion; DLQ for bad jobs.

## Domain Modeling (schemas)

- **Tenant**: `id uuid PK`, `slug unique`, `name`, `status enum`, `plan`, `monthlySoftLimit`, `monthlyHardLimit`, `metadata jsonb`.
- **User**: `id uuid PK`, `email`, `passwordHash`, `role`, `tenantId FK`. Unique `(tenantId, email)` via index.
- **API Key**: `id uuid PK`, `keyHash unique`, `keyPrefix indexed`, `label`, `scopes[]`, `expiresAt`, `lastUsedAt`, `tenantId FK`.
- **Event**: `id uuid PK`, `tenantId FK`, `type`, `source`, `payload jsonb`, `occurredAt timestamptz`, `idempotencyKey indexed`.
- **Rule**: `id uuid PK`, `tenantId FK`, `name`, `eventType`, `version`, `status`, `definition jsonb { conditions, actions }`.
- **NotificationConfig**: `id uuid PK`, `tenantId FK`, `channel enum`, `config jsonb`, `status`.
- **UsageRecord**: `id uuid PK`, `tenantId FK`, `eventsIngested`, `notificationsSent`, `periodStart date`, `periodEnd date`.
- **IdempotencyKey**: `id uuid PK`, unique `(tenantId, idempotencyKey)`, optional `eventId`.

## Auth & Multi-Tenancy

- **JWT auth** for dashboard: Bearer token verified via `JwtAuthGuard`; loads user + tenant, attaches to request.
- **API key auth** for ingestion: `ApiKeyGuard` reads `x-api-key`, matches prefix + bcrypt hash; attaches tenant to request.
- **Tenant isolation**: All tables reference `tenantId`; guards attach tenant to request; services always filter by `tenantId`.

## Event Ingestion Pipeline

- **Endpoint**: `POST /api/events` with `x-api-key` + optional `idempotency-key`.
- **Sync path**: Authn, validation, idempotency lookup, insert event, record idempotency key, increment usage, enqueue BullMQ job, respond `{id,status}`.
- **Async path**: Worker consumes job → fetch event + tenant → rules evaluation → notifications → usage increments.
- **Idempotency**: `(tenantId, idempotencyKey)` unique; returns existing event if seen.
- **Rate limiting/limits**: Soft/hard monthly limits per tenant checked before write; hard limit raises 429.
- **Failure handling**: Queue retries with exponential backoff; DLQ on repeated failure.

## Queue & Workers

- **Setup**: BullMQ queues `events` and `events-dlq`; attempts=5, exponential backoff starting 2s.
- **Worker**: Runs in separate Nest context. Loads event, tenant, rules; evaluates; dispatches notifications; increments usage.
- **Retry rationale**: 5 attempts balances transient failure recovery with bounded latency; backoff avoids thundering herd.
- **Message loss prevention**: Redis persistence + acknowledgements; jobs removed on success; DLQ retains failed payloads.

## Rule Engine

- **Rule shape**: JSON with `conditions` (e.g., `{ equals: { severity: "high" } }`) and `actions` (e.g., `[{ type: "notify", channel: "email", subject: "...", template: "..."}]`).
- **Safety**: No dynamic eval; only declarative operators; version field on rules.
- **Extensibility**: New condition/action types added via schema expansion; old versions remain valid.

## Notification System

- **Abstraction**: `NotificationProvider` interface; concrete Email/Telegram/WhatsApp providers.
- **Fallbacks**: Queue-level retries; DLQ for persistent failures; per-channel configs enable/disable.
- **Status**: Log-based for now; ready to persist delivery statuses per provider response.

## Billing & Usage

- **Counting**: `UsageRecord` per month per tenant; increments on ingestion and notifications.
- **Limits**: `monthlySoftLimit` warns; `monthlyHardLimit` blocks ingestion.
- **Overages & retries**: Idempotency prevents double-counting ingestion; notification billing increments occur after successful send.

## Infra & Deployment

- **Dockerfile**: Multi-stage build (tsc) to slim runtime.
- **docker-compose**: API + worker + Postgres + Redis.
- **ENV strategy**: Centralized in ConfigModule; `env.sample` provided.
- **CI/CD**: GitHub Actions (lint + build) stubbed for fast feedback; extend with tests & deploy as needed.
- **Secrets**: Expect env vars/secret manager (not committed); JWT secret required.
- **Scaling**: API and worker services scale independently by adding replicas behind a load balancer / process manager.

## Manual Smoke Test

1. **Prepare DB** (migrations pending): seed a tenant and API key.
   - Generate key + hash: `node -e "const b=require('bcryptjs');const key='test_api_key_123';console.log({key,prefix:key.slice(0,16),hash:b.hashSync(key,12)});"`
   - Insert sample data (e.g. via psql):
     ```
     INSERT INTO tenants(id,slug,name,status,plan,monthly_soft_limit,monthly_hard_limit)
     VALUES (gen_random_uuid(),'acme','Acme Inc','active','free',100000,120000);
     INSERT INTO api_keys(id,key_hash,key_prefix,label,scopes,tenant_id)
     VALUES (gen_random_uuid(),'<HASH>','<PREFIX>','seed key','{}',(SELECT id FROM tenants WHERE slug='acme'));
     ```
2. **Run API and worker**: `npm run start:dev` (or `npm start` after `npm run build`) and `npm run worker`. Ensure `DATABASE_URL` is set (Supabase needs `?sslmode=require`).
3. **Ingest an event**:
   ```
   curl -X POST http://localhost:3000/api/events \
     -H "Content-Type: application/json" \
     -H "x-api-key: test_api_key_123" \
     -d '{"type":"user.signup","payload":{"email":"user@example.com"}}'
   ```
   Expect `{ "id": "...", "status": "enqueued" }`.
4. **Swagger UI**: `http://localhost:3000/api/docs` for interactive testing (supports JWT bearer and x-api-key).
5. **Observe worker logs**: rules evaluated, notifications logged (providers are stubs). Add a rule on `user.signup` with a `notify` action to see notification logs.
6. **DLQ**: failed jobs land in `events-dlq`; inspect via Redis CLI or BullMQ UI if attached.

## Decisions I Made and Why

- **Redis + BullMQ**: Reliable queueing with retries/backoff and DLQ; good Nest integration; operationally lighter than Kafka for this scale.
- **PostgreSQL**: Strong consistency, relational modeling for tenants/usage/billing; JSONB for flexible payloads without losing indexes.
- **Modular monolith**: Keeps boundaries clear (modules) without microservice overhead; async queues still isolate workloads.
- **Not built yet**: Provider-specific delivery persistence, UI, migrations tooling, full RBAC, analytics dashboards.
- **Known limits**: Rule engine is minimal (basic equals); notification providers are stubs; migrations required before prod.
