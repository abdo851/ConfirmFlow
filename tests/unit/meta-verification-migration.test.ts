import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_FILE = "007_meta_credential_verification.sql";

function readMigrationSql(): string {
  return readFileSync(
    join(process.cwd(), "database", "migrations", MIGRATION_FILE),
    "utf8",
  );
}

describe("M4-C meta credential verification migration SQL", () => {
  const sql = readMigrationSql();

  it("adds verification state to meta_connections", () => {
    expect(sql).toContain("verification_status");
    expect(sql).toContain("verified_at");
    expect(sql).toContain("'unverified'");
    expect(sql).toContain("'verified'");
    expect(sql).toContain("'credentials_valid'");
    expect(sql).toContain("'identifier_not_verified'");
    expect(sql).toContain("'failed'");
  });

  it("does not create conversion or CAPI delivery tables", () => {
    for (const table of [
      "conversion_events",
      "meta_capi_events",
      "purchase_events",
    ]) {
      expect(sql).not.toContain(table);
    }
    expect(sql).not.toContain("/events");
  });
});
