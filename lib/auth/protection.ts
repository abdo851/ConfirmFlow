import { stripLocalePrefix } from "@/lib/i18n/paths";

export function isProtectedAppPath(pathname: string): boolean {
  const normalized = stripLocalePrefix(pathname);
  return (
    normalized.startsWith("/dashboard") ||
    normalized.startsWith("/onboarding")
  );
}

export function isShopifyWebhookPath(pathname: string): boolean {
  return pathname === "/api/integrations/shopify/webhooks";
}

export function isYouCanWebhookPath(pathname: string): boolean {
  return pathname === "/api/integrations/youcan/webhooks";
}

export function isProtectedShopifyApiPath(pathname: string): boolean {
  if (isShopifyWebhookPath(pathname)) {
    return false;
  }

  return pathname.startsWith("/api/integrations/shopify");
}

export function isProtectedYouCanApiPath(pathname: string): boolean {
  if (isYouCanWebhookPath(pathname)) {
    return false;
  }

  return pathname.startsWith("/api/integrations/youcan");
}

export function isProtectedMetaApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/integrations/meta");
}
