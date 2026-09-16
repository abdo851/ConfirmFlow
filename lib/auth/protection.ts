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

export function isProtectedShopifyApiPath(pathname: string): boolean {
  if (isShopifyWebhookPath(pathname)) {
    return false;
  }

  return pathname.startsWith("/api/integrations/shopify");
}
