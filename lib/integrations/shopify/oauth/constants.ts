/**
 * Minimum Shopify scope for OAuth connection verification in M2-B.
 * Does not include order, customer, or webhook scopes.
 */
export const SHOPIFY_OAUTH_DEFAULT_SCOPES = "read_products";

export const SHOPIFY_OAUTH_STATE_COOKIE = "shopify_oauth_state";
export const SHOPIFY_CONNECTING_COOKIE = "shopify_connecting";
export const SHOPIFY_CONNECTION_COOKIE = "shopify_connection";

export const SHOPIFY_OAUTH_STATE_TTL_SECONDS = 600;
export const SHOPIFY_CONNECTING_TTL_SECONDS = 900;
