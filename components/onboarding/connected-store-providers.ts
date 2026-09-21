import type { ConnectionStatus } from "@/lib/connections/types";

export interface ConnectedStoreProvider {
  provider: "youcan" | "shopify" | "woocommerce";
  target?: string;
}

function optionalTarget(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Connected when any store provider has an active connection. */
export function listConnectedStoreProviders(input: {
  youcan: { status: ConnectionStatus; storeSlug?: string };
  shopify: { status: ConnectionStatus; shop?: string };
  woocommerce: { connected: boolean; store_url?: string };
}): ConnectedStoreProvider[] {
  const connected: ConnectedStoreProvider[] = [];

  if (input.youcan.status === "connected") {
    connected.push({
      provider: "youcan",
      target: optionalTarget(input.youcan.storeSlug),
    });
  }

  if (input.shopify.status === "connected") {
    connected.push({
      provider: "shopify",
      target: optionalTarget(input.shopify.shop),
    });
  }

  if (input.woocommerce.connected) {
    connected.push({
      provider: "woocommerce",
      target: optionalTarget(input.woocommerce.store_url),
    });
  }

  return connected;
}
