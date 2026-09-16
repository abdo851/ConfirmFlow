import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_FILE = "006_meta_connection_foundation.sql";

function readMetaMigrationSql(): string {
  return readFileSync(
    join(process.cwd(), "database", "migrations", MIGRATION_FILE),
    "utf8",
  );
}

describe("M4-A meta connection migration SQL", () => {
  const sql = readMetaMigrationSql();

  it("creates meta connection tables", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.meta_connections");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.meta_connection_secrets");
  });

  it("stores pixel identifiers without access tokens in public table", () => {
    const publicTableMatch = sql.match(
      /CREATE TABLE IF NOT EXISTS public\.meta_connections[\s\S]*?\);/,
    );
    expect(publicTableMatch?.[0]).toContain("pixel_id TEXT NOT NULL");
    expect(publicTableMatch?.[0]).not.toContain("access_token");
  });

  it("enables RLS without permissive policies", () => {
    expect(sql).toContain("ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("ALTER TABLE public.meta_connection_secrets ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("CREATE POLICY meta_connections_select_own");
    expect(sql).not.toMatch(/CREATE POLICY meta_connection_secrets_/);
    expect(sql).not.toContain("USING (true)");
  });

  it("does not create conversion or CAPI tables", () => {
    for (const table of [
      "conversion_events",
      "meta_capi_events",
      "purchase_events",
    ]) {
      expect(sql).not.toContain(table);
    }
  });
});
