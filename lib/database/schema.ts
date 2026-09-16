import { readFileSync } from "node:fs";
import { join } from "node:path";

export const MVP_MIGRATION_FILE = "002_mvp_database_foundation.sql";

export const MVP_TABLES = [
  "profiles",
  "stores",
  "store_connections",
  "shopify_connections",
  "shopify_connection_secrets",
] as const;

export const USER_OWNED_TABLES = [
  "profiles",
  "stores",
  "store_connections",
  "shopify_connections",
] as const;

export const SERVER_ONLY_TABLES = [
  "shopify_connection_secrets",
  "store_webhook_events",
] as const;

export const WEBHOOK_MIGRATION_FILE = "003_shopify_webhook_ingestion.sql";

export const WEBHOOK_TABLES = ["store_webhook_events"] as const;

export function readMvpMigrationSql(): string {
  return readFileSync(
    join(process.cwd(), "database", "migrations", MVP_MIGRATION_FILE),
    "utf8",
  );
}
