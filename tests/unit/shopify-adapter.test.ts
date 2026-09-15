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

  it("does not perform real Shopify connection operations", async () => {
    const connectResult = await shopifyAdapter.connect({
      storeId: "store_1",
      platform: "shopify",
      credentialsRef: "placeholder",
    });

    expect(connectResult.success).toBe(false);
    expect(connectResult.error).toContain("next Shopify milestone");
    expect(await shopifyAdapter.verifyConnection("store_1")).toBe(false);
  });

  it("does not verify webhooks in M2-A", async () => {
    expect(await shopifyAdapter.verifyWebhook({}, "{}")).toBe(false);
  });
});
