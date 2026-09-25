import { beforeEach, describe, expect, it, vi } from "vitest";
import { encryptSecret } from "@/lib/integrations/shopify/oauth";
import { loadEligibleTikTokConnectionForStore } from "@/lib/integrations/tiktok/delivery/eligibility";

const SECRET = "test-tiktok-session-secret-minimum-length";
const mockFrom = vi.fn();

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/integrations/tiktok/env", () => ({
  getTikTokEnv: () => ({ TIKTOK_SESSION_SECRET: SECRET }),
}));

function connectionQuery(status: string) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "store_connections") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { id: "conn-1" }, error: null }),
                }),
              }),
            }),
          }),
        }),
      };
    }

    if (table === "tiktok_connections") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { pixel_code: "PIXEL12345", verification_status: status },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === "tiktok_connection_secrets") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                encrypted_access_token: encryptSecret("tiktok_raw_access_token", SECRET),
              },
              error: null,
            }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("TikTok delivery eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows delivery only when the connection is verified", async () => {
    connectionQuery("verified");

    const result = await loadEligibleTikTokConnectionForStore({ storeId: "store-1" });

    expect(result.eligible).toBe(true);
    if (result.eligible) {
      expect(result.connection.pixelCode).toBe("PIXEL12345");
      expect(result.connection.accessToken).toBe("tiktok_raw_access_token");
    }
  });

  it("blocks delivery while the connection is unverified", async () => {
    connectionQuery("unverified");

    const result = await loadEligibleTikTokConnectionForStore({ storeId: "store-1" });

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.message).toMatch(/not been verified/i);
    }
  });

  it("blocks delivery when no TikTok connection exists", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "store_connections") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await loadEligibleTikTokConnectionForStore({ storeId: "store-1" });
    expect(result.eligible).toBe(false);
  });
});
