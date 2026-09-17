import "server-only";

import { cookies } from "next/headers";
import type { ConnectionStatus } from "@/lib/connections";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  disconnectShopifyConnectionForUser,
  getShopifyAccessTokenForUser,
  getShopifyConnectionStateForUser,
} from "@/lib/integrations/shopify/persistence";
import {
  SHOPIFY_CONNECTING_COOKIE,
  SHOPIFY_CONNECTING_TTL_SECONDS,
  SHOPIFY_CONNECTION_COOKIE,
} from "@/lib/integrations/shopify/oauth";
import type { ShopifyConnectionPublicState } from "./types";

/**
 * M2-B prototype cookie for durable Shopify credentials — removed in M2-C3.
 * Cleared only from mutation boundaries (OAuth callback, disconnect) so legacy
 * browser sessions do not retain tokens.
 */
export async function clearLegacyShopifyConnectionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SHOPIFY_CONNECTION_COOKIE);
}

function getSecureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Short-lived non-secret UI indicator while OAuth is in progress. */
export async function setShopifyConnectingFlag(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    SHOPIFY_CONNECTING_COOKIE,
    "1",
    getSecureCookieOptions(SHOPIFY_CONNECTING_TTL_SECONDS),
  );
}

export async function clearShopifyConnectingFlag(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SHOPIFY_CONNECTING_COOKIE);
}

export async function clearShopifyConnection(): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  await disconnectShopifyConnectionForUser(user.id);
  await clearLegacyShopifyConnectionCookie();
}

export async function getShopifyAccessToken(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }

  return getShopifyAccessTokenForUser(user.id);
}

export async function getShopifyConnectionPublicState(): Promise<ShopifyConnectionPublicState> {
  const cookieStore = await cookies();
  const connecting = cookieStore.get(SHOPIFY_CONNECTING_COOKIE)?.value === "1";

  if (connecting) {
    return {
      provider: "shopify",
      status: "connecting",
    };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      provider: "shopify",
      status: "not_connected",
    };
  }

  const persisted = await getShopifyConnectionStateForUser(user.id);
  if (!persisted) {
    return {
      provider: "shopify",
      status: "not_connected",
    };
  }

  return persisted;
}

export async function verifyShopifyConnectionActive(): Promise<boolean> {
  const state = await getShopifyConnectionPublicState();
  if (state.status !== "connected") {
    return false;
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return false;
  }

  const token = await getShopifyAccessTokenForUser(user.id);
  return Boolean(token);
}

export function toStoreConnectionStatus(
  publicState: ShopifyConnectionPublicState,
): ConnectionStatus {
  return publicState.status;
}
