import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_FILE = "003_shopify_webhook_ingestion.sql";

function readWebhookMigrationSql(): string {
  return readFileSync(
    join(process.cwd(), "database", "migrations", MIGRATION_FILE),
    "utf8",
  );
}

describe("M3-A webhook ingestion migration SQL", () => {
  const sql = readWebhookMigrationSql();

  it("creates the store_webhook_events table", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.store_webhook_events");
  });

  it("enforces provider-scoped external event uniqueness", () => {
    expect(sql).toContain("UNIQUE (store_id, provider, external_event_id)");
  });

  it("includes ingestion status and payload hash columns", () => {
    expect(sql).toContain("payload_hash TEXT NOT NULL");
    expect(sql).toContain("status TEXT NOT NULL");
    expect(sql).toContain("'accepted'");
    expect(sql).toContain("'unsupported'");
    expect(sql).toContain("'duplicate'");
  });

  it("enables RLS without broad authenticated policies", () => {
    expect(sql).toContain(
      "ALTER TABLE public.store_webhook_events ENABLE ROW LEVEL SECURITY",
    );
    expect(sql).not.toMatch(/CREATE POLICY[\s\S]*store_webhook_events/);
    expect(sql).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it("does not create future-milestone tables", () => {
    for (const table of [
      "orders",
      "order_events",
      "conversion_events",
      "subscriptions",
      "confirmation",
    ]) {
      expect(sql).not.toMatch(
        new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`),
      );
    }
  });
});
