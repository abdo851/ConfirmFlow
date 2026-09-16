import { describe, expect, it } from "vitest";
import {
  META_TABLES,
  MVP_TABLES,
  SERVER_ONLY_TABLES,
  USER_OWNED_TABLES,
  readMvpMigrationSql,
} from "@/lib/database/schema";
import {
  toConnectionStatus,
  toStoreConnectionStatus,
} from "@/lib/database/connection-status";
import { hasServiceRoleKey } from "@/lib/database/service-role";
import { DB_TABLES } from "@/lib/database/constants";

describe("M2-C2 MVP migration SQL", () => {
  const sql = readMvpMigrationSql();

  it("defines all MVP tables", () => {
    for (const table of MVP_TABLES) {
      expect(sql).toContain(`public.${table}`);
    }
  });

  it("enables RLS on user-owned tables", () => {
    for (const table of USER_OWNED_TABLES) {
      expect(sql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`,
      );
    }
  });

  it("enables RLS on server-only secrets table", () => {
    expect(sql).toContain(
      "ALTER TABLE public.shopify_connection_secrets ENABLE ROW LEVEL SECURITY",
    );
  });

  it("does not grant authenticated access to secrets table", () => {
    expect(sql).not.toContain(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_connection_secrets",
    );
  });

  it("restricts shopify_connections writes to service role", () => {
    expect(sql).toContain("GRANT SELECT ON public.shopify_connections TO authenticated");
    expect(sql).not.toMatch(
      /CREATE POLICY shopify_connections_(insert|update|delete)/,
    );
  });

  it("does not create user policies on secrets table", () => {
    const secretsSection = sql.split("shopify_connection_secrets")[1] ?? "";
    expect(secretsSection).not.toMatch(
      /CREATE POLICY[\s\S]*shopify_connection_secrets/,
    );
  });

  it("avoids broad USING (true) policies on user-owned data", () => {
    expect(sql).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it("does not create future-milestone tables from M0 design", () => {
    const excluded = [
      "orders",
      "customers",
      "order_events",
      "conversion_events",
      "subscriptions",
      "audit_logs",
      "integrations",
    ];
    for (const table of excluded) {
      expect(sql).not.toMatch(
        new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`),
      );
    }
  });

  it("references auth.users for profile ownership", () => {
    expect(sql).toContain("REFERENCES auth.users(id)");
  });

  it("creates profile auto-provision trigger on auth.users", () => {
    expect(sql).toContain("on_auth_user_created");
    expect(sql).toContain("handle_new_user");
  });
});

describe("Database table constants", () => {
  it("matches MVP table names", () => {
    expect(Object.values(DB_TABLES).sort()).toEqual(
      [...MVP_TABLES, ...META_TABLES, "store_webhook_events", "orders"].sort(),
    );
  });

  it("separates server-only tables", () => {
    expect(SERVER_ONLY_TABLES).toEqual([
      "shopify_connection_secrets",
      "meta_connection_secrets",
      "store_webhook_events",
    ]);
  });
});

describe("Connection status mapping", () => {
  it("maps UI not_connected to DB inactive", () => {
    expect(toStoreConnectionStatus("not_connected")).toBe("inactive");
  });

  it("maps DB active to UI connected", () => {
    expect(toConnectionStatus("active")).toBe("connected");
  });

  it("round-trips all statuses", () => {
    const uiStatuses = [
      "not_connected",
      "connecting",
      "connected",
      "error",
    ] as const;
    for (const ui of uiStatuses) {
      expect(toConnectionStatus(toStoreConnectionStatus(ui))).toBe(ui);
    }
  });
});

describe("Service role availability", () => {
  it("reports whether service role key is configured", () => {
    const original = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(hasServiceRoleKey()).toBe(false);
    process.env.SUPABASE_SERVICE_ROLE_KEY = original;
  });
});
