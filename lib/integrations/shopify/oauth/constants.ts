/**
 * Minimum Shopify scopes for OAuth connection and orders/create webhooks.
 */
export const SHOPIFY_OAUTH_DEFAULT_SCOPES = "read_products,read_orders";

export const SHOPIFY_OAUTH_STATE_COOKIE = "shopify_oauth_state";
export const SHOPIFY_CONNECTING_COOKIE = "shopify_connecting";
export const SHOPIFY_CONNECTION_COOKIE = "shopify_connection";

export const SHOPIFY_OAUTH_STATE_TTL_SECONDS = 600;
export const SHOPIFY_CONNECTING_TTL_SECONDS = 900;
