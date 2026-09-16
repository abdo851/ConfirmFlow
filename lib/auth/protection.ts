export function isProtectedAppPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")
  );
}

export function isProtectedShopifyApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/integrations/shopify");
}
