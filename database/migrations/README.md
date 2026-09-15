# Database Migrations

All schema changes must be versioned through numbered SQL migration files in this directory.

## Rules

1. Never modify production schema directly.
2. Never delete production data.
3. Never use destructive schema-reset logic for production.
4. Apply migrations in order (`001_`, `002_`, …).
5. Each migration should be idempotent where possible (`IF NOT EXISTS`).

## Applying Migrations

Use the Supabase CLI or dashboard SQL editor in development/staging environments only until a formal migration pipeline is approved.
