import { describe, expect, it } from "vitest";
import { listConnectedStoreProviders } from "@/components/onboarding/connected-store-providers";

describe("onboarding connection badge", () => {
  it("stays disconnected when no store provider is active", () => {
    expect(
      listConnectedStoreProviders({
        youcan: { status: "not_connected" },
        shopify: { status: "not_connected" },
        woocommerce: { connected: false },
      }),
    ).toEqual([]);
  });

  it("treats WooCommerce as connected even when YouCan and Shopify are not", () => {
    expect(
      listConnectedStoreProviders({
        youcan: { status: "not_connected" },
        shopify: { status: "error" },
        woocommerce: {
          connected: true,
          store_url: "https://ancientcoach.s2-tastewp.com",
        },
      }),
    ).toEqual([
      {
        provider: "woocommerce",
        target: "https://ancientcoach.s2-tastewp.com",
      },
    ]);
  });

  it("lists every active provider", () => {
    expect(
      listConnectedStoreProviders({
        youcan: { status: "connected", storeSlug: "elitemart1" },
        shopify: { status: "connecting", shop: "demo.myshopify.com" },
        woocommerce: { connected: true, store_url: " https://store.example " },
      }),
    ).toEqual([
      { provider: "youcan", target: "elitemart1" },
      { provider: "woocommerce", target: "https://store.example" },
    ]);
  });
});
