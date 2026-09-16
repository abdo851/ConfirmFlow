import type { ConnectionStatus } from "@/lib/connections";

export interface ShopifyConnectionPublicState {
  provider: "shopify";
  shop?: string;
  status: ConnectionStatus;
  errorMessage?: string;
}
