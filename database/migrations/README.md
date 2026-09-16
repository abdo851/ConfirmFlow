# Database Migrations

All schema changes must be versioned through numbered SQL migration files in this directory.

## Rules

1. Never modify production schema directly.
2. Never delete production data.
3. Never use destructive schema-reset logic for production.
4. Apply migrations in order (`001_`, `002_`, …).
5. Each migration should be idempotent where possible (`IF NOT EXISTS`).

## Current MVP Schema

- `002_mvp_database_foundation.sql` — **active MVP schema** (profiles, stores, store_connections, shopify_connections, shopify_connection_secrets)
- `003_shopify_webhook_ingestion.sql` — **M3-A webhook ingestion** (store_webhook_events idempotency/event records)
- `004_shopify_order_ingestion.sql` — **M3-B order ingestion** (normalized orders with pending confirmation status)
- `005_confirmation_engine_foundation.sql` — **M3-C confirmation engine** (pending → confirmed transition, confirmed_at)
- `001_initial_schema.sql` — historical M0 design; **do not apply** (superseded by 002)

## Applying Migrations

1. Install the Supabase CLI (`npx supabase` or global install).
2. Link the project: `npx supabase link --project-ref <ref>`
3. Push migrations: `npx supabase db push`

Alternatively, run the SQL file against the Confirma database using a privileged connection (database password or service role).

Do not apply schema changes through ad-hoc dashboard edits — use versioned migration files only.
