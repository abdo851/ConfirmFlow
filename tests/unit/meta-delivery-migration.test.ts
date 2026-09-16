import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_FILE = "008_meta_purchase_delivery.sql";

function readMigrationSql(): string {
  return readFileSync(
    join(process.cwd(), "database", "migrations", MIGRATION_FILE),
    "utf8",
  );
}

describe("M4-D meta purchase delivery migration SQL", () => {
  const sql = readMigrationSql();

  it("creates meta_conversion_deliveries with required fields", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.meta_conversion_deliveries");
    expect(sql).toContain("event_id TEXT NOT NULL");
    expect(sql).toContain("status TEXT NOT NULL DEFAULT 'pending'");
    expect(sql).toContain("'pending', 'sending', 'sent', 'failed'");
    expect(sql).toContain("meta_conversion_deliveries_event_id_unique");
    expect(sql).toContain("meta_conversion_deliveries_order_provider_event_unique");
  });

  it("does not store access tokens or raw Meta responses", () => {
    expect(sql).not.toContain("access_token");
    expect(sql).not.toContain("raw_response");
  });

  it("enables RLS for merchant-owned reads only", () => {
    expect(sql).toContain("ALTER TABLE public.meta_conversion_deliveries ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("CREATE POLICY meta_conversion_deliveries_select_own");
    expect(sql).not.toMatch(/CREATE POLICY meta_conversion_deliveries_.*INSERT/i);
  });
});
