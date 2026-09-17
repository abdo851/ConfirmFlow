import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHOPIFY_ADMIN_API_VERSION } from "@/lib/integrations/shopify/constants";
import { SHOPIFY_ORDER_CREATE_TOPIC } from "@/lib/integrations/shopify/webhooks/constants";

const WEBHOOK_URL = "https://app.example.com/api/integrations/shopify/webhooks";
const SHOP = "demo.myshopify.com";
const ACCESS_TOKEN = "shpat_test_access_token";
const STORE_ID = "store-1";
const USER_ID = "user-1";

vi.mock("@/lib/config/urls", () => ({
  getShopifyWebhookUrl: () => WEBHOOK_URL,
}));

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

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

function createFetchMock(handlers: {
  list?: { status: number; body?: unknown };
  delete?: { status: number; webhookId?: number };
}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/webhooks.json") && init?.method === "GET") {
      return new Response(JSON.stringify(handlers.list?.body ?? {}), {
        status: handlers.list?.status ?? 200,
      });
    }

    if (url.includes("/webhooks/") && init?.method === "DELETE") {
      return new Response(null, {
        status: handlers.delete?.status ?? 200,
      });
    }

    throw new Error(`Unexpected fetch call: ${url} ${init?.method ?? "GET"}`);
  });
}

function createEqChain<T>(terminal: () => Promise<T>) {
  const chain = {
    eq: () => chain,
    maybeSingle: terminal,
  };
  return chain;
}

async function mockActiveShopifyCredentialsDatabase(
  ownerId = USER_ID,
  options?: { includeCredentials?: boolean; secretDeleteCalls?: string[] },
) {
  const { encryptSecret } = await import("@/lib/integrations/shopify/oauth");
  const encryptedAccessToken = encryptSecret(
    ACCESS_TOKEN,
    "test-session-secret-with-minimum-length-123456",
  );
  const includeCredentials = options?.includeCredentials ?? true;

  mockFrom.mockImplementation((table: string) => {
    if (table === "stores") {
      return {
        select: (columns?: string) => ({
          eq: (column: string) => {
            if (column === "id" && columns?.includes("owner_id")) {
              return {
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: STORE_ID,
                      owner_id: ownerId,
                      external_store_id: SHOP,
                    },
                    error: null,
                  }),
                }),
              };
            }

            if (column === "owner_id") {
              return {
                eq: () => ({
                  limit: async () => ({
                    data: [{ id: STORE_ID }],
                    error: null,
                  }),
                }),
              };
            }

            return {
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: STORE_ID, owner_id: ownerId },
                  error: null,
                }),
              }),
              limit: async () => ({
                data: [{ id: STORE_ID }],
                error: null,
              }),
            };
          },
        }),
      };
    }

    if (table === "store_connections") {
      return {
        select: () =>
          createEqChain(async () => ({
            data: includeCredentials
              ? { id: "conn-1", status: "active" }
              : { id: "conn-1" },
            error: null,
          })),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      };
    }

    if (table === "shopify_connections") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { shop_domain: SHOP },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      };
    }

    if (table === "shopify_connection_secrets") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () =>
              includeCredentials
                ? {
                    data: { encrypted_access_token: encryptedAccessToken },
                    error: null,
                  }
                : { data: null, error: null },
          }),
        }),
        delete: () => ({
          eq: async () => {
            options?.secretDeleteCalls?.push(table);
            return { error: null };
          },
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });
}

function mockStoreOwnership(ownerId = USER_ID) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "stores") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: STORE_ID, owner_id: ownerId },
                error: null,
              }),
            }),
            limit: async () => ({
              data: [{ id: STORE_ID }],
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

    if (table === "shopify_connection_secrets") {
      return {
        delete: () => ({
          eq: async () => ({ error: null }),
        }),
      };
    }

    if (table === "shopify_connections") {
      return {
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("Shopify webhook unregister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("identifies the Confirma orders/create webhook using the exact configured destination URL", async () => {
    const { findConfirmaOrdersCreateWebhook } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    const match = findConfirmaOrdersCreateWebhook(
      [
        {
          id: 10,
          topic: SHOPIFY_ORDER_CREATE_TOPIC,
          address: WEBHOOK_URL,
        },
        {
          id: 11,
          topic: SHOPIFY_ORDER_CREATE_TOPIC,
          address: "https://other.example.com/webhooks",
        },
      ],
      WEBHOOK_URL,
    );

    expect(match?.id).toBe(10);
  });

  it("does not delete unrelated Shopify webhooks", async () => {
    const fetchImpl = createFetchMock({
      list: {
        status: 200,
        body: {
          webhooks: [
            {
              id: 1,
              topic: "products/update",
              address: WEBHOOK_URL,
            },
            {
              id: 2,
              topic: SHOPIFY_ORDER_CREATE_TOPIC,
              address: "https://other-app.example.com/webhooks",
            },
          ],
        },
      },
    });

    const { unregisterShopifyOrdersCreateWebhook } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    const result = await unregisterShopifyOrdersCreateWebhook(
      { shop: SHOP, accessToken: ACCESS_TOKEN },
      fetchImpl,
    );

    expect(result.action).toBe("already_missing");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("deletes the existing Confirma webhook successfully", async () => {
    const fetchImpl = createFetchMock({
      list: {
        status: 200,
        body: {
          webhooks: [
            {
              id: 42,
              topic: SHOPIFY_ORDER_CREATE_TOPIC,
              address: WEBHOOK_URL,
            },
          ],
        },
      },
      delete: { status: 200, webhookId: 42 },
    });

    const { unregisterShopifyOrdersCreateWebhook } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    const result = await unregisterShopifyOrdersCreateWebhook(
      { shop: SHOP, accessToken: ACCESS_TOKEN },
      fetchImpl,
    );

    expect(result.action).toBe("deleted");
    expect(result.webhookId).toBe(42);
    expect(fetchImpl).toHaveBeenCalledWith(
      `https://${SHOP}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/webhooks/42.json`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "X-Shopify-Access-Token": ACCESS_TOKEN,
        }),
      }),
    );
  });

  it("treats a missing Confirma webhook idempotently", async () => {
    const fetchImpl = createFetchMock({
      list: { status: 200, body: { webhooks: [] } },
    });

    const { unregisterShopifyOrdersCreateWebhook } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    const result = await unregisterShopifyOrdersCreateWebhook(
      { shop: SHOP, accessToken: ACCESS_TOKEN },
      fetchImpl,
    );

    expect(result.action).toBe("already_missing");
  });

  it("surfaces Shopify webhook deletion failure safely without exposing tokens", async () => {
    const fetchImpl = createFetchMock({
      list: {
        status: 200,
        body: {
          webhooks: [
            {
              id: 55,
              topic: SHOPIFY_ORDER_CREATE_TOPIC,
              address: WEBHOOK_URL,
            },
          ],
        },
      },
      delete: { status: 500 },
    });

    const {
      unregisterShopifyOrdersCreateWebhook,
      ShopifyWebhookRegistrationError,
    } = await import("@/lib/integrations/shopify/webhooks/register");

    await expect(
      unregisterShopifyOrdersCreateWebhook(
        { shop: SHOP, accessToken: ACCESS_TOKEN },
        fetchImpl,
      ),
    ).rejects.toBeInstanceOf(ShopifyWebhookRegistrationError);

    try {
      await unregisterShopifyOrdersCreateWebhook(
        { shop: SHOP, accessToken: ACCESS_TOKEN },
        fetchImpl,
      );
    } catch (error) {
      expect(String(error)).not.toContain(ACCESS_TOKEN);
      expect(String(error)).not.toContain("shpat_");
    }
  });
});

describe("Shopify disconnect persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not delete credentials when webhook cleanup fails", async () => {
    const deleteCalls: string[] = [];
    await mockActiveShopifyCredentialsDatabase(USER_ID, {
      secretDeleteCalls: deleteCalls,
    });

    const fetchImpl = createFetchMock({
      list: {
        status: 200,
        body: {
          webhooks: [
            {
              id: 77,
              topic: SHOPIFY_ORDER_CREATE_TOPIC,
              address: WEBHOOK_URL,
            },
          ],
        },
      },
      delete: { status: 502 },
    });

    const { disconnectShopifyStoreForUser } = await import(
      "@/lib/integrations/shopify/persistence"
    );
    const { ShopifyWebhookRegistrationError } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    await expect(
      disconnectShopifyStoreForUser(USER_ID, STORE_ID, fetchImpl),
    ).rejects.toBeInstanceOf(ShopifyWebhookRegistrationError);

    expect(deleteCalls).toHaveLength(0);
  });

  it("removes credentials after successful webhook cleanup", async () => {
    const deleteCalls: string[] = [];
    await mockActiveShopifyCredentialsDatabase(USER_ID, {
      secretDeleteCalls: deleteCalls,
    });

    const fetchImpl = createFetchMock({
      list: {
        status: 200,
        body: {
          webhooks: [
            {
              id: 88,
              topic: SHOPIFY_ORDER_CREATE_TOPIC,
              address: WEBHOOK_URL,
            },
          ],
        },
      },
      delete: { status: 200 },
    });

    const { disconnectShopifyStoreForUser } = await import(
      "@/lib/integrations/shopify/persistence"
    );

    await disconnectShopifyStoreForUser(USER_ID, STORE_ID, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/webhooks/88.json"),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(deleteCalls).toContain("shopify_connection_secrets");
  });

  it("enforces ownership validation", async () => {
    mockStoreOwnership("other-user");

    const { disconnectShopifyStoreForUser, ShopifyPersistenceError } =
      await import("@/lib/integrations/shopify/persistence");

    await expect(
      disconnectShopifyStoreForUser(USER_ID, STORE_ID),
    ).rejects.toBeInstanceOf(ShopifyPersistenceError);
  });

  it("treats repeated disconnect as safe when credentials are already removed", async () => {
    await mockActiveShopifyCredentialsDatabase(USER_ID, {
      includeCredentials: false,
    });

    const fetchImpl = createFetchMock({
      list: { status: 200, body: { webhooks: [] } },
    });

    const { disconnectShopifyStoreForUser } = await import(
      "@/lib/integrations/shopify/persistence"
    );

    await expect(
      disconnectShopifyStoreForUser(USER_ID, STORE_ID, fetchImpl),
    ).resolves.toBeUndefined();
    await expect(
      disconnectShopifyStoreForUser(USER_ID, STORE_ID, fetchImpl),
    ).resolves.toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("ShopifyAdapter.disconnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to the Shopify disconnect implementation", async () => {
    const disconnectModule = await import("@/lib/integrations/shopify/disconnect");
    const disconnectSpy = vi
      .spyOn(disconnectModule, "disconnectShopifyStoreForAuthenticatedUser")
      .mockResolvedValue(undefined);

    const { shopifyAdapter } = await import("@/integrations/stores/shopify");
    const result = await shopifyAdapter.disconnect(STORE_ID);

    expect(disconnectSpy).toHaveBeenCalledWith(STORE_ID);
    expect(result.success).toBe(true);
    expect(JSON.stringify(result)).not.toContain(ACCESS_TOKEN);
  });

  it("returns a safe failure payload without exposing access tokens", async () => {
    const disconnectModule = await import("@/lib/integrations/shopify/disconnect");
    vi.spyOn(
      disconnectModule,
      "disconnectShopifyStoreForAuthenticatedUser",
    ).mockRejectedValue(
      new (
        await import("@/lib/integrations/shopify/webhooks/register")
      ).ShopifyWebhookRegistrationError("shopify_webhook_delete_failed:500"),
    );

    const { shopifyAdapter } = await import("@/integrations/stores/shopify");
    const result = await shopifyAdapter.disconnect(STORE_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unable to disconnect Shopify store.");
    expect(JSON.stringify(result)).not.toContain(ACCESS_TOKEN);
    expect(JSON.stringify(result)).not.toContain("shpat_");
  });
});

describe("Shopify disconnect API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const { POST } = await import(
      "@/app/api/integrations/shopify/disconnect/route"
    );
    const response = await POST();

    expect(response.status).toBe(401);
  });

  it("returns a safe webhook cleanup failure without exposing tokens", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    const disconnectModule = await import("@/lib/integrations/shopify/disconnect");
    const { ShopifyWebhookRegistrationError } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: USER_ID } as never);
    vi.spyOn(
      disconnectModule,
      "disconnectShopifyForAuthenticatedUser",
    ).mockRejectedValue(
      new ShopifyWebhookRegistrationError("shopify_webhook_delete_failed:502"),
    );

    const { POST } = await import(
      "@/app/api/integrations/shopify/disconnect/route"
    );
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Unable to disconnect Shopify store.");
    expect(JSON.stringify(body)).not.toContain(ACCESS_TOKEN);
    expect(JSON.stringify(body)).not.toContain("shpat_");
  });

});

describe("Shopify disconnect orchestrator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("uses credentials server-side only and never returns tokens", async () => {
    const { getAuthenticatedUser } = await import("@/lib/auth/session");
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: USER_ID } as never);

    const persistenceModule = await import(
      "@/lib/integrations/shopify/persistence"
    );
    const disconnectSpy = vi
      .spyOn(persistenceModule, "disconnectShopifyConnectionForUser")
      .mockResolvedValue(undefined);

    const { disconnectShopifyForAuthenticatedUser } = await import(
      "@/lib/integrations/shopify/disconnect"
    );

    await disconnectShopifyForAuthenticatedUser();

    expect(disconnectSpy).toHaveBeenCalledWith(USER_ID, expect.any(Function));
    expect(JSON.stringify({ ok: true })).not.toContain(ACCESS_TOKEN);
  });
});
