import { beforeEach, describe, expect, it, vi } from "vitest";
import { decryptSecret } from "@/lib/integrations/shopify/oauth";
import { persistTikTokConnection } from "@/lib/integrations/tiktok/persistence";

const SECRET = "test-tiktok-session-secret-minimum-length";
const mockFrom = vi.fn();

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/integrations/tiktok/env", () => ({
  getTikTokEnv: () => ({ TIKTOK_SESSION_SECRET: SECRET }),
}));

describe("TikTok persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores an encrypted token and never the raw value", async () => {
    const upserts: Array<{ table: string; payload: Record<string, unknown> }> = [];

    mockFrom.mockImplementation((table: string) => {
      if (table === "tiktok_connections") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          upsert: (payload: Record<string, unknown>) => {
            upserts.push({ table, payload });
            return Promise.resolve({ error: null });
          },
        };
      }

      if (table === "stores") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: [{ id: "store-1" }], error: null }),
              }),
            }),
          }),
        };
      }

      return {
        upsert: (payload: Record<string, unknown>) => {
          upserts.push({ table, payload });
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

    await persistTikTokConnection({
      owner_id: "user-1",
      pixel_code: "PIXEL12345",
      access_token: "tiktok_raw_access_token",
    });

    const secret = upserts.find((call) => call.table === "tiktok_connection_secrets");
    const connection = upserts.find((call) => call.table === "store_connections");
    const encrypted = secret?.payload.encrypted_access_token;

    expect(connection?.payload.provider).toBe("tiktok");
    expect(typeof encrypted).toBe("string");
    expect(encrypted).not.toBe("tiktok_raw_access_token");
    expect(decryptSecret(String(encrypted), SECRET)).toBe("tiktok_raw_access_token");
    expect(JSON.stringify(upserts)).not.toContain("tiktok_raw_access_token");
  });
});
