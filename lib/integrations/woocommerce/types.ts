import type { ConnectionStatus } from "@/lib/connections/types";

export interface WooCommerceOAuthStatePayload {
  nonce: string;
  storeUrl: string;
  userId: string;
  issuedAt: number;
}

export interface WooCommerceCallbackCredentials {
  keyId: string;
  userId: string;
  consumerKey: string;
  consumerSecret: string;
  keyPermissions: string | null;
}

export interface WooCommerceConnectionPublicState {
  connected: boolean;
  store_url?: string;
  status?: ConnectionStatus;
  error_message?: string;
}
