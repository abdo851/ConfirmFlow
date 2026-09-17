import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildShopifyWebhookUrl } from "@/lib/config/app-url";
import { SHOPIFY_ADMIN_API_VERSION } from "@/lib/integrations/shopify/constants";
import { SHOPIFY_ORDER_CREATE_TOPIC } from "@/lib/integrations/shopify/webhooks/constants";

const WEBHOOK_URL = "https://app.example.com/api/integrations/shopify/webhooks";
const SHOP = "demo.myshopify.com";
const ACCESS_TOKEN = "shpat_test_access_token";

vi.mock("@/lib/config/urls", () => ({
  getShopifyWebhookUrl: () => WEBHOOK_URL,
}));

const mockGetShopifyStoreCredentialsForStore = vi.fn();

vi.mock("@/lib/integrations/shopify/persistence", () => ({
  getShopifyStoreCredentialsForStore: (...args: unknown[]) =>
    mockGetShopifyStoreCredentialsForStore(...args),
}));

function createFetchMock(handlers: {
  list?: { status: number; body?: unknown };
  create?: { status: number; body?: unknown };
  update?: { status: number; body?: unknown };
}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/webhooks.json") && init?.method === "GET") {
      return new Response(JSON.stringify(handlers.list?.body ?? {}), {
        status: handlers.list?.status ?? 200,
      });
    }

    if (url.endsWith("/webhooks.json") && init?.method === "POST") {
      const requestBody = JSON.parse(String(init.body)) as {
        webhook: { topic: string; address: string; format: string };
      };

      expect(requestBody.webhook.topic).toBe(SHOPIFY_ORDER_CREATE_TOPIC);
      expect(requestBody.webhook.address).toBe(WEBHOOK_URL);
      expect(requestBody.webhook.format).toBe("json");

      return new Response(JSON.stringify(handlers.create?.body ?? {}), {
        status: handlers.create?.status ?? 201,
      });
    }

    if (url.includes("/webhooks/") && init?.method === "PUT") {
      return new Response(JSON.stringify(handlers.update?.body ?? {}), {
        status: handlers.update?.status ?? 200,
      });
    }

    throw new Error(`Unexpected fetch call: ${url} ${init?.method ?? "GET"}`);
  });
}

describe("Shopify webhook registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetShopifyStoreCredentialsForStore.mockResolvedValue({
      storeId: "store-1",
      ownerId: "user-1",
      shopDomain: SHOP,
      accessToken: ACCESS_TOKEN,
    });
  });

  it("constructs orders/create registration against the Admin API", async () => {
    const fetchImpl = createFetchMock({
      list: { status: 200, body: { webhooks: [] } },
      create: {
        status: 201,
        body: {
          webhook: {
            id: 42,
            topic: SHOPIFY_ORDER_CREATE_TOPIC,
            address: WEBHOOK_URL,
          },
        },
      },
    });

    const { registerShopifyOrdersCreateWebhook } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    const result = await registerShopifyOrdersCreateWebhook(
      { shop: SHOP, accessToken: ACCESS_TOKEN },
      fetchImpl,
    );

    expect(result.action).toBe("created");
    expect(result.webhookId).toBe(42);
    expect(fetchImpl).toHaveBeenCalledWith(
      `https://${SHOP}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/webhooks.json`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Shopify-Access-Token": ACCESS_TOKEN,
        }),
      }),
    );
    expect(buildShopifyWebhookUrl("https://app.example.com")).toBe(WEBHOOK_URL);
  });

  it("uses the centralized webhook URL by default", async () => {
    const fetchImpl = createFetchMock({
      list: { status: 200, body: { webhooks: [] } },
      create: {
        status: 201,
        body: {
          webhook: {
            id: 7,
            topic: SHOPIFY_ORDER_CREATE_TOPIC,
            address: WEBHOOK_URL,
          },
        },
      },
    });

    const { registerShopifyOrdersCreateWebhook } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    await registerShopifyOrdersCreateWebhook(
      { shop: SHOP, accessToken: ACCESS_TOKEN },
      fetchImpl,
    );

    const createCall = fetchImpl.mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    const body = JSON.parse(String(createCall?.[1]?.body)) as {
      webhook: { address: string };
    };
    expect(body.webhook.address).toBe(WEBHOOK_URL);
  });

  it("returns a safe success payload without exposing access tokens", async () => {
    const fetchImpl = createFetchMock({
      list: { status: 200, body: { webhooks: [] } },
      create: {
        status: 201,
        body: {
          webhook: {
            id: 99,
            topic: SHOPIFY_ORDER_CREATE_TOPIC,
            address: WEBHOOK_URL,
          },
        },
      },
    });

    const {
      registerShopifyOrdersCreateWebhook,
      toSafeWebhookRegistrationResponse,
    } = await import("@/lib/integrations/shopify/webhooks/register");

    const result = await registerShopifyOrdersCreateWebhook(
      { shop: SHOP, accessToken: ACCESS_TOKEN },
      fetchImpl,
    );
    const response = toSafeWebhookRegistrationResponse(result);

    expect(response).toEqual({
      success: true,
      action: "created",
      webhookId: 99,
    });
    expect(JSON.stringify(response)).not.toContain(ACCESS_TOKEN);
    expect(JSON.stringify(response)).not.toContain("shpat_");
  });

  it("returns a safe error when Shopify rejects registration", async () => {
    const fetchImpl = createFetchMock({
      list: { status: 200, body: { webhooks: [] } },
      create: { status: 422, body: { errors: "Invalid address" } },
    });

    const { registerShopifyOrdersCreateWebhook, ShopifyWebhookRegistrationError } =
      await import("@/lib/integrations/shopify/webhooks/register");

    await expect(
      registerShopifyOrdersCreateWebhook(
        { shop: SHOP, accessToken: ACCESS_TOKEN },
        fetchImpl,
      ),
    ).rejects.toBeInstanceOf(ShopifyWebhookRegistrationError);
  });

  it("does not create duplicate subscriptions when already registered", async () => {
    const fetchImpl = createFetchMock({
      list: {
        status: 200,
        body: {
          webhooks: [
            {
              id: 15,
              topic: SHOPIFY_ORDER_CREATE_TOPIC,
              address: WEBHOOK_URL,
            },
          ],
        },
      },
    });

    const { registerShopifyOrdersCreateWebhook } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    const result = await registerShopifyOrdersCreateWebhook(
      { shop: SHOP, accessToken: ACCESS_TOKEN },
      fetchImpl,
    );

    expect(result.action).toBe("already_registered");
    expect(result.webhookId).toBe(15);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("updates an existing orders/create webhook when the destination changed", async () => {
    const fetchImpl = createFetchMock({
      list: {
        status: 200,
        body: {
          webhooks: [
            {
              id: 21,
              topic: SHOPIFY_ORDER_CREATE_TOPIC,
              address: "https://old.example.com/webhooks",
            },
          ],
        },
      },
      update: {
        status: 200,
        body: {
          webhook: {
            id: 21,
            topic: SHOPIFY_ORDER_CREATE_TOPIC,
            address: WEBHOOK_URL,
          },
        },
      },
    });

    const { registerShopifyOrdersCreateWebhook } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    const result = await registerShopifyOrdersCreateWebhook(
      { shop: SHOP, accessToken: ACCESS_TOKEN },
      fetchImpl,
    );

    expect(result.action).toBe("updated");
    expect(fetchImpl).toHaveBeenCalledWith(
      `https://${SHOP}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/webhooks/21.json`,
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("registers only orders/create and ignores unrelated topics when checking duplicates", async () => {
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
          ],
        },
      },
      create: {
        status: 201,
        body: {
          webhook: {
            id: 2,
            topic: SHOPIFY_ORDER_CREATE_TOPIC,
            address: WEBHOOK_URL,
          },
        },
      },
    });

    const { registerShopifyOrdersCreateWebhook } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );

    const result = await registerShopifyOrdersCreateWebhook(
      { shop: SHOP, accessToken: ACCESS_TOKEN },
      fetchImpl,
    );

    expect(result.action).toBe("created");
    expect(result.webhookId).toBe(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("enforces ownership when registering for an owned store", async () => {
    const fetchImpl = createFetchMock({
      list: { status: 200, body: { webhooks: [] } },
      create: {
        status: 201,
        body: {
          webhook: {
            id: 3,
            topic: SHOPIFY_ORDER_CREATE_TOPIC,
            address: WEBHOOK_URL,
          },
        },
      },
    });

    const {
      registerShopifyWebhooksForOwnedStore,
      ShopifyWebhookRegistrationError,
    } = await import("@/lib/integrations/shopify/webhooks/register");

    await expect(
      registerShopifyWebhooksForOwnedStore("store-1", "other-user", fetchImpl),
    ).rejects.toBeInstanceOf(ShopifyWebhookRegistrationError);

    const result = await registerShopifyWebhooksForOwnedStore(
      "store-1",
      "user-1",
      fetchImpl,
    );

    expect(result.action).toBe("created");
    expect(mockGetShopifyStoreCredentialsForStore).toHaveBeenCalledWith("store-1");
  });

  it("loads credentials server-side for store registration without returning tokens", async () => {
    const fetchImpl = createFetchMock({
      list: { status: 200, body: { webhooks: [] } },
      create: {
        status: 201,
        body: {
          webhook: {
            id: 4,
            topic: SHOPIFY_ORDER_CREATE_TOPIC,
            address: WEBHOOK_URL,
          },
        },
      },
    });

    const { registerShopifyWebhooksForStore, toSafeWebhookRegistrationResponse } =
      await import("@/lib/integrations/shopify/webhooks/register");

    const result = await registerShopifyWebhooksForStore("store-1", fetchImpl);

    const createCall = fetchImpl.mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    expect(createCall?.[1]?.headers).toMatchObject({
      "X-Shopify-Access-Token": ACCESS_TOKEN,
    });
    expect(JSON.stringify(toSafeWebhookRegistrationResponse(result))).not.toContain(
      ACCESS_TOKEN,
    );
  });
});

describe("ShopifyAdapter.registerWebhooks", () => {
  it("delegates registration to the Shopify webhook service", async () => {
    const fetchImpl = createFetchMock({
      list: { status: 200, body: { webhooks: [] } },
      create: {
        status: 201,
        body: {
          webhook: {
            id: 5,
            topic: SHOPIFY_ORDER_CREATE_TOPIC,
            address: WEBHOOK_URL,
          },
        },
      },
    });

    vi.stubGlobal("fetch", fetchImpl);

    const { shopifyAdapter } = await import("@/integrations/stores/shopify");
    await shopifyAdapter.registerWebhooks("store-1");

    expect(mockGetShopifyStoreCredentialsForStore).toHaveBeenCalledWith("store-1");
  });
});
