import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_FILE = "005_confirmation_engine_foundation.sql";

function readConfirmationMigrationSql(): string {
  return readFileSync(
    join(process.cwd(), "database", "migrations", MIGRATION_FILE),
    "utf8",
  );
}

describe("M3-C confirmation migration SQL", () => {
  const sql = readConfirmationMigrationSql();

  it("extends confirmation_status to include confirmed", () => {
    expect(sql).toContain("CHECK (confirmation_status IN ('pending', 'confirmed'))");
  });

  it("adds confirmed_at without creating new tables", () => {
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ");
    expect(sql).not.toContain("CREATE TABLE");
  });

  it("does not create Meta or conversion tables", () => {
    for (const table of [
      "conversion_events",
      "meta_connections",
      "subscriptions",
      "billing",
    ]) {
      expect(sql).not.toContain(table);
    }
  });
});
