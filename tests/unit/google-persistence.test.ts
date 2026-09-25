import { beforeEach, describe, expect, it, vi } from "vitest";
import { decryptSecret } from "@/lib/integrations/shopify/oauth";
import { persistGoogleConnection } from "@/lib/integrations/google/persistence";

const SECRET = "test-google-session-secret-minimum-length";
const mockFrom = vi.fn();

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/integrations/google/env", () => ({
  getGoogleEnv: () => ({ GOOGLE_SESSION_SECRET: SECRET }),
}));

describe("Google persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores an encrypted token and the conversion label", async () => {
    const upserts: Array<{ table: string; payload: Record<string, unknown> }> = [];

    mockFrom.mockImplementation((table: string) => {
      if (table === "google_connections") {
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

    await persistGoogleConnection({
      owner_id: "user-1",
      conversion_id: "AW-1234567890",
      conversion_label: "purchase_label",
      access_token: "google_raw_access_token",
    });

    const secret = upserts.find((call) => call.table === "google_connection_secrets");
    const connection = upserts.find((call) => call.table === "google_connections");
    const storeConnection = upserts.find((call) => call.table === "store_connections");
    const encrypted = secret?.payload.encrypted_access_token;

    expect(storeConnection?.payload.provider).toBe("google");
    expect(connection?.payload.conversion_id).toBe("AW-1234567890");
    expect(connection?.payload.conversion_label).toBe("purchase_label");
    expect(encrypted).not.toBe("google_raw_access_token");
    expect(decryptSecret(String(encrypted), SECRET)).toBe("google_raw_access_token");
    expect(JSON.stringify(upserts)).not.toContain("google_raw_access_token");
  });
});
