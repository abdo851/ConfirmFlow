import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as connectPost } from "@/app/api/integrations/meta/connect/route";
import { GET as statusGet } from "@/app/api/integrations/meta/status/route";
import { POST as disconnectPost } from "@/app/api/integrations/meta/disconnect/route";
import { MetaMarketingAdapter } from "@/integrations/marketing/meta/meta-marketing-adapter";
import {
  MetaPersistenceError,
  assertPixelAvailableForUser,
  disconnectMetaConnectionForUser,
  persistMetaConnectionForUser,
} from "@/lib/integrations/meta/persistence";
import {
  maskPixelId,
  parseMetaConnectionInput,
} from "@/lib/integrations/meta/validation";

const mockFrom = vi.fn();

vi.mock("@/lib/database/client", () => ({
  createDatabaseClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/integrations/meta/env", () => ({
  getMetaEnv: () => ({
    META_SESSION_SECRET: "test-meta-session-secret-minimum-length-1234",
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/integrations/meta/session", () => ({
  getMetaConnectionPublicState: vi.fn(),
  clearMetaConnection: vi.fn(),
}));

describe("Meta connection validation", () => {
  it("accepts valid pixel and token input", () => {
    const result = parseMetaConnectionInput({
      pixelId: "123456789012345",
      accessToken: "test-access-token",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects malformed Meta configuration", () => {
    expect(parseMetaConnectionInput({ pixelId: "abc", accessToken: "x" }).ok).toBe(
      false,
    );
    expect(parseMetaConnectionInput({ pixelId: "12345", accessToken: "" }).ok).toBe(
      false,
    );
    expect(parseMetaConnectionInput(null).ok).toBe(false);
  });

  it("masks pixel identifiers for display", () => {
    expect(maskPixelId("123456789012345")).toBe("****2345");
  });
});

describe("Meta persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects pixels already owned by another user", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "meta_connections") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { store_connection_id: "conn-1", pixel_id: "123456789012345" },
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
      assertPixelAvailableForUser(
        { from: mockFrom } as never,
        "123456789012345",
        "user-1",
      ),
    ).rejects.toBeInstanceOf(MetaPersistenceError);
  });

  it("persists encrypted secrets without storing the raw token", async () => {
    const upsertCalls: Array<{ table: string; payload: Record<string, unknown> }> =
      [];

    mockFrom.mockImplementation((table: string) => {
      if (table === "meta_connections") {
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

      if (table === "stores") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({
                  data: [{ id: "store-1" }],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      return {
        upsert: (payload: Record<string, unknown>) => {
          upsertCalls.push({ table, payload });
          if (table === "store_connections") {
            return {
              select: () => ({
                single: async () => ({ data: { id: "conn-1" }, error: null }),
              }),
            };
          }
          return Promise.resolve({ error: null });
        },
        delete: () => ({
          eq: async () => ({ error: null }),
        }),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      };
    });

    await persistMetaConnectionForUser({
      userId: "user-1",
      pixelId: "123456789012345",
      accessToken: "meta_raw_access_token_value",
    });

    const secretUpsert = upsertCalls.find(
      (call) => call.table === "meta_connection_secrets",
    );

    expect(secretUpsert).toBeTruthy();
    expect(secretUpsert?.payload.encrypted_access_token).toBeTruthy();
    expect(secretUpsert?.payload.encrypted_access_token).not.toBe(
      "meta_raw_access_token_value",
    );
    expect(JSON.stringify(upsertCalls)).not.toContain("meta_raw_access_token_value");
  });

  it("removes encrypted secrets on disconnect", async () => {
    const deleteCalls: string[] = [];

    mockFrom.mockImplementation((table: string) => {
      if (table === "stores") {
        return {
          select: () => ({
            eq: async () => ({
              data: [{ id: "store-1" }],
              error: null,
            }),
          }),
        };
      }

      if (table === "store_connections") {
        return {
          select: () => ({
            in: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "conn-1" },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }

      if (table === "meta_connection_secrets") {
        return {
          delete: () => ({
            eq: async () => {
              deleteCalls.push(table);
              return { error: null };
            },
          }),
        };
      }

      if (table === "meta_connections") {
        return {
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await disconnectMetaConnectionForUser("user-1");
    expect(deleteCalls).toContain("meta_connection_secrets");
  });
});

describe("Meta connection API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated connect requests", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const response = await connectPost(
      new Request("http://localhost/api/integrations/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixelId: "123456789012345",
          accessToken: "token",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("never returns access tokens from status API", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    const { getMetaConnectionPublicState } = await import(
      "@/lib/integrations/meta/session"
    );

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getMetaConnectionPublicState).mockResolvedValue({
      provider: "meta",
      status: "connected",
      pixelId: "****2345",
    });

    const response = await statusGet();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pixelId).toBe("****2345");
    expect(JSON.stringify(body)).not.toContain("accessToken");
    expect(JSON.stringify(body)).not.toContain("token");
  });

  it("requires authentication for disconnect", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const response = await disconnectPost();
    expect(response.status).toBe(401);
  });
});

describe("Meta marketing adapter boundary", () => {
  it("does not send conversion events", async () => {
    const adapter = new MetaMarketingAdapter();
    const fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    const result = await adapter.sendConversion({
      eventType: "purchase",
      orderId: "order-1",
      storeId: "store-1",
      value: 100,
      currency: "USD",
    });

    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
