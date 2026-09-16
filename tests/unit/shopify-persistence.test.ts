import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ShopifyPersistenceError,
  assertShopAvailableForUser,
  buildShopifyStoreName,
  persistShopifyConnectionForUser,
} from "@/lib/integrations/shopify/persistence";

const mockFrom = vi.fn();

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/integrations/shopify/env", () => ({
  getShopifyOAuthEnv: () => ({
    SHOPIFY_SESSION_SECRET: "test-session-secret-with-minimum-length-123456",
  }),
}));

describe("Shopify persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a readable store name from the shop domain", () => {
    expect(buildShopifyStoreName("demo.myshopify.com")).toBe("demo");
  });

  it("rejects shops already owned by another user", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "shopify_connections") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { store_connection_id: "conn-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "store_connections") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { store_id: "store-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "stores") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { owner_id: "other-user" },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      assertShopAvailableForUser(
        { from: mockFrom } as never,
        "demo.myshopify.com",
        "user-1",
      ),
    ).rejects.toBeInstanceOf(ShopifyPersistenceError);
  });

  it("persists encrypted secrets without storing the raw token", async () => {
    const upsertCalls: Array<{ table: string; payload: Record<string, unknown> }> =
      [];

    mockFrom.mockImplementation((table: string) => {
      if (table === "shopify_connections") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          upsert: (payload: Record<string, unknown>) => {
            upsertCalls.push({ table, payload });
            return Promise.resolve({ error: null });
          },
        };
      }

      return {
        upsert: (payload: Record<string, unknown>) => {
          upsertCalls.push({ table, payload });
          if (table === "stores") {
            return {
              select: () => ({
                single: async () => ({ data: { id: "store-1" }, error: null }),
              }),
            };
          }
          if (table === "store_connections") {
            return {
              select: () => ({
                single: async () => ({ data: { id: "conn-1" }, error: null }),
              }),
            };
          }
          return Promise.resolve({ error: null });
        },
      };
    });

    await persistShopifyConnectionForUser({
      userId: "user-1",
      userEmail: "owner@example.com",
      shop: "demo.myshopify.com",
      accessToken: "shpat_raw_token_value",
      scope: "read_products",
    });

    const secretUpsert = upsertCalls.find(
      (call) => call.table === "shopify_connection_secrets",
    );

    expect(secretUpsert).toBeTruthy();
    expect(secretUpsert?.payload.encrypted_access_token).toBeTruthy();
    expect(secretUpsert?.payload.encrypted_access_token).not.toBe(
      "shpat_raw_token_value",
    );
    expect(JSON.stringify(upsertCalls)).not.toContain("shpat_raw_token_value");
    expect(upsertCalls.some((call) => call.table === "stores")).toBe(true);
    expect(upsertCalls.some((call) => call.table === "store_connections")).toBe(
      true,
    );
  });
});
