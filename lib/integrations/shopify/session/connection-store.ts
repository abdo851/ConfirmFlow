import "server-only";

import { cookies } from "next/headers";
import type { ConnectionStatus } from "@/lib/connections";
import { getShopifyOAuthEnv } from "@/lib/integrations/shopify/env";
import {
  SHOPIFY_CONNECTING_COOKIE,
  SHOPIFY_CONNECTING_TTL_SECONDS,
  SHOPIFY_CONNECTION_COOKIE,
  encryptSecret,
  decryptSecret,
} from "@/lib/integrations/shopify/oauth";
import type {
  ShopifyConnectionPublicState,
  ShopifyConnectionRecord,
} from "./types";

const CONNECTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function getSecureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function serializeConnection(record: ShopifyConnectionRecord): string {
  const env = getShopifyOAuthEnv();
  return encryptSecret(JSON.stringify(record), env.SHOPIFY_SESSION_SECRET);
}

function deserializeConnection(value: string): ShopifyConnectionRecord | null {
  const env = getShopifyOAuthEnv();
  const decrypted = decryptSecret(value, env.SHOPIFY_SESSION_SECRET);
  if (!decrypted) {
    return null;
  }

  try {
    return JSON.parse(decrypted) as ShopifyConnectionRecord;
  } catch {
    return null;
  }
}

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

export async function saveShopifyConnection(input: {
  shop: string;
  accessToken: string;
  scope?: string;
}): Promise<void> {
  const env = getShopifyOAuthEnv();
  const record: ShopifyConnectionRecord = {
    provider: "shopify",
    shop: input.shop,
    status: "connected",
    encryptedAccessToken: encryptSecret(
      input.accessToken,
      env.SHOPIFY_SESSION_SECRET,
    ),
    scope: input.scope,
    connectedAt: new Date().toISOString(),
  };

  const cookieStore = await cookies();
  cookieStore.set(
    SHOPIFY_CONNECTION_COOKIE,
    serializeConnection(record),
    getSecureCookieOptions(CONNECTION_COOKIE_MAX_AGE),
  );
}

export async function saveShopifyConnectionError(
  message: string,
): Promise<void> {
  const record: ShopifyConnectionRecord = {
    provider: "shopify",
    shop: "",
    status: "error",
    errorMessage: message,
  };

  const cookieStore = await cookies();
  cookieStore.set(
    SHOPIFY_CONNECTION_COOKIE,
    serializeConnection(record),
    getSecureCookieOptions(60 * 10),
  );
}

export async function clearShopifyConnection(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SHOPIFY_CONNECTION_COOKIE);
}

export async function getShopifyConnectionRecord(): Promise<ShopifyConnectionRecord | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SHOPIFY_CONNECTION_COOKIE)?.value;
  if (!value) {
    return null;
  }

  return deserializeConnection(value);
}

export async function getShopifyAccessToken(): Promise<string | null> {
  const record = await getShopifyConnectionRecord();
  if (!record?.encryptedAccessToken || record.status !== "connected") {
    return null;
  }

  const env = getShopifyOAuthEnv();
  return decryptSecret(record.encryptedAccessToken, env.SHOPIFY_SESSION_SECRET);
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

  const record = await getShopifyConnectionRecord();
  if (!record) {
    return {
      provider: "shopify",
      status: "not_connected",
    };
  }

  return {
    provider: "shopify",
    shop: record.shop || undefined,
    status: record.status,
    errorMessage: record.errorMessage,
  };
}

export async function verifyShopifyConnectionActive(): Promise<boolean> {
  const record = await getShopifyConnectionRecord();
  return record?.status === "connected" && Boolean(record.encryptedAccessToken);
}

export function toStoreConnectionStatus(
  publicState: ShopifyConnectionPublicState,
): ConnectionStatus {
  return publicState.status;
}
