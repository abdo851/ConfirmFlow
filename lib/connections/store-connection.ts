import "server-only";

import { getDefaultConnectionState } from "./defaults";
import type { ConnectionState } from "./types";
import { getShopifyConnectionPublicState } from "@/lib/integrations/shopify/session";
import { getWooCommerceConnectionPublicState } from "@/lib/integrations/woocommerce";
import { getYouCanConnectionPublicState } from "@/lib/integrations/youcan/session";

export async function getStoreConnectionState(): Promise<ConnectionState> {
  const base = getDefaultConnectionState("store");
  const [youcan, shopify, woocommerce] = await Promise.all([
    getYouCanConnectionPublicState().catch(() => ({
      status: "not_connected" as const,
      storeSlug: undefined,
      errorMessage: undefined,
    })),
    getShopifyConnectionPublicState().catch(() => ({
      status: "not_connected" as const,
      shop: undefined,
      errorMessage: undefined,
    })),
    getWooCommerceConnectionPublicState().catch(() => ({ connected: false as const })),
  ]);

  const youcanConnected = youcan.status === "connected";
  const shopifyConnected = shopify.status === "connected";
  const wooConnected = Boolean(woocommerce.connected);
  const connected = youcanConnected || shopifyConnected || wooConnected;
  const target = wooConnected
    ? ("store_url" in woocommerce ? woocommerce.store_url : undefined)
    : youcanConnected
      ? youcan.storeSlug
      : shopifyConnected
        ? shopify.shop
        : undefined;

  return {
    ...base,
    status: connected ? "connected" : youcan.status === "error" || shopify.status === "error" ? "error" : "not_connected",
    metadata: {
      shopDomain: target,
      storeSlug: youcanConnected ? youcan.storeSlug : undefined,
      errorMessage:
        youcan.errorMessage ??
        shopify.errorMessage ??
        ("error_message" in woocommerce ? woocommerce.error_message : undefined),
    },
  };
}
