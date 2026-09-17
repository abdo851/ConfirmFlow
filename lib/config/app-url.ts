/** Pure URL builders — safe for client and test environments. */

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

export function buildAppPath(baseUrl: string, pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${normalizeBaseUrl(baseUrl)}${normalizedPath}`;
}

export function buildShopifyOAuthCallbackUrl(baseUrl: string): string {
  return buildAppPath(baseUrl, "/api/integrations/shopify/callback");
}

export function buildWebhookBaseUrl(baseUrl: string): string {
  return buildAppPath(baseUrl, "/api/webhooks");
}

export function buildShopifyWebhookUrl(baseUrl: string): string {
  return buildAppPath(baseUrl, "/api/integrations/shopify/webhooks");
}

export function buildAuthCallbackUrl(
  baseUrl: string,
  nextPath = "/onboarding",
): string {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${buildAppPath(baseUrl, "/api/auth/callback")}?next=${encodeURIComponent(next)}`;
}
