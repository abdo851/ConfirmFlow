import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_FILE = "004_shopify_order_ingestion.sql";

function readOrderMigrationSql(): string {
  return readFileSync(
    join(process.cwd(), "database", "migrations", MIGRATION_FILE),
    "utf8",
  );
}

describe("M3-B order ingestion migration SQL", () => {
  const sql = readOrderMigrationSql();

  it("creates the orders table", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.orders");
  });

  it("enforces store-scoped external order uniqueness", () => {
    expect(sql).toContain("UNIQUE (store_id, provider, external_order_id)");
  });

  it("stores monetary values as integer minor units", () => {
    expect(sql).toContain("subtotal_amount_minor BIGINT");
    expect(sql).toContain("total_amount_minor BIGINT");
  });

  it("defaults confirmation status to pending only", () => {
    expect(sql).toContain("confirmation_status TEXT NOT NULL DEFAULT 'pending'");
    expect(sql).toContain("CHECK (confirmation_status IN ('pending'))");
  });

  it("does not store raw provider payloads", () => {
    expect(sql).not.toContain("raw_payload");
    expect(sql).not.toContain("payload JSONB");
  });

  it("enables owner-scoped read RLS without permissive write policies", () => {
    expect(sql).toContain("ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("CREATE POLICY orders_select_own");
    expect(sql).toContain("owner_id = auth.uid()");
    expect(sql).not.toMatch(/CREATE POLICY orders_(insert|update|delete)/);
    expect(sql).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it("does not create future-milestone tables", () => {
    for (const table of [
      "conversion_events",
      "subscriptions",
      "confirmation_requests",
      "billing",
    ]) {
      expect(sql).not.toMatch(
        new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`),
      );
    }
  });
});
