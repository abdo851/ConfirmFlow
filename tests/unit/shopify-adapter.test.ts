import { describe, expect, it } from "vitest";
import {
  SHOPIFY_PROVIDER_ID,
  shopifyAdapter,
} from "@/integrations/stores/shopify";
import {
  getStoreAdapter,
  isSupportedStoreProvider,
  supportedStoreProviders,
} from "@/lib/integrations/stores";
import { getDefaultConnectionState } from "@/lib/connections";

describe("Shopify integration foundation", () => {
  it("recognizes Shopify as a supported store provider", () => {
    expect(isSupportedStoreProvider("shopify")).toBe(true);
    expect(supportedStoreProviders).toEqual([
      { id: "shopify", label: "Shopify" },
    ]);
  });

  it("registers ShopifyAdapter in the store adapter registry", () => {
    expect(getStoreAdapter("shopify")).toBe(shopifyAdapter);
    expect(getStoreAdapter("shopify").platform).toBe(SHOPIFY_PROVIDER_ID);
  });

  it("keeps default store connection state as not connected", () => {
    const store = getDefaultConnectionState("store");
    expect(store.status).toBe("not_connected");
    expect(store.metadata?.provider).toBe("shopify");
  });

  it("routes connect through the Shopify OAuth API", async () => {
    const connectResult = await shopifyAdapter.connect({
      storeId: "store_1",
      platform: "shopify",
      credentialsRef: "placeholder",
    });

    expect(connectResult.success).toBe(false);
    expect(connectResult.error).toContain("/api/integrations/shopify/connect");
  });

  it("verifies Shopify webhooks when configured", async () => {
    const secret = "shopify-test-secret";
    const body = JSON.stringify({ id: 1 });
    const { signShopifyWebhookBody } = await import(
      "@/lib/integrations/shopify/webhooks/hmac"
    );
    const hmac = signShopifyWebhookBody(body, secret);

    process.env.SHOPIFY_API_SECRET = secret;

    expect(
      await shopifyAdapter.verifyWebhook(
        {
          "X-Shopify-Hmac-SHA256": hmac,
          "X-Shopify-Shop-Domain": "demo.myshopify.com",
          "X-Shopify-Topic": "orders/create",
          "X-Shopify-Webhook-Id": "wh_1",
        },
        body,
      ),
    ).toBe(true);

    expect(await shopifyAdapter.verifyWebhook({}, body)).toBe(false);
  });
});
