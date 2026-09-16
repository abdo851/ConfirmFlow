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
    metadata: {
      provider: "shopify",
      shopDomain: shopify.shop,
      errorMessage: shopify.errorMessage,
    },
  };
}
