import "server-only";

import { getDefaultConnectionState } from "./defaults";
import type { ConnectionState } from "./types";
import { getShopifyConnectionPublicState } from "@/lib/integrations/shopify/session";

export async function getStoreConnectionState(): Promise<ConnectionState> {
  const base = getDefaultConnectionState("store");
  const shopify = await getShopifyConnectionPublicState();

  return {
    ...base,
    status: shopify.status,
    description: shopify.shop
      ? `Connected to ${shopify.shop}`
      : base.description,
    metadata: {
      provider: "shopify",
      errorMessage: shopify.errorMessage,
    },
  };
}
