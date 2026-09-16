import { stripLocalePrefix } from "@/lib/i18n/paths";

export function isProtectedAppPath(pathname: string): boolean {
  const normalized = stripLocalePrefix(pathname);
  return (
    normalized.startsWith("/dashboard") ||
    normalized.startsWith("/onboarding")
  );
}

export function isProtectedShopifyApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/integrations/shopify");
}
