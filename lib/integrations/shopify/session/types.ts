import type { ConnectionStatus } from "@/lib/connections";

export interface ShopifyConnectionRecord {
  provider: "shopify";
  shop: string;
  status: ConnectionStatus;
  encryptedAccessToken?: string;
  scope?: string;
  connectedAt?: string;
  errorMessage?: string;
}

export interface ShopifyConnectionPublicState {
  provider: "shopify";
  shop?: string;
  status: ConnectionStatus;
  errorMessage?: string;
}
