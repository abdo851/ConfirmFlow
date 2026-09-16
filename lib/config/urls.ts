import "server-only";

import { getSupabasePublicEnv } from "@/lib/validation/env";
import {
  buildShopifyOAuthCallbackUrl,
  buildShopifyWebhookUrl,
  buildWebhookBaseUrl,
  normalizeBaseUrl,
} from "./app-url";

/**
 * Canonical public application base URL from environment configuration.
 */
export function getAppBaseUrl(): string {
  const env = getSupabasePublicEnv();
  return normalizeBaseUrl(env.NEXT_PUBLIC_APP_URL);
}

/** Shopify OAuth callback — locale-independent API route. */
export function getShopifyOAuthCallbackUrl(): string {
  return buildShopifyOAuthCallbackUrl(getAppBaseUrl());
}

/** Future webhook base URL — not implemented in M2-C4. */
export function getWebhookBaseUrl(): string {
  return buildWebhookBaseUrl(getAppBaseUrl());
}

/** Shopify webhook ingestion endpoint — locale-independent API route. */
export function getShopifyWebhookUrl(): string {
  return buildShopifyWebhookUrl(getAppBaseUrl());
}
