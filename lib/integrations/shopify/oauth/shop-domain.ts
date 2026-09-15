const SHOP_DOMAIN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

export function normalizeShopDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  const withDomain = trimmed.includes(".")
    ? trimmed
    : `${trimmed}.myshopify.com`;

  if (!SHOP_DOMAIN_PATTERN.test(withDomain)) {
    return null;
  }

  return withDomain;
}

export function buildShopifyAuthorizeUrl(params: {
  shop: string;
  clientId: string;
  scopes: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(`https://${params.shop}/admin/oauth/authorize`);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("scope", params.scopes);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  return url.toString();
}
