/**
 * Database table names for the M2-C2 MVP schema.
 */
export const DB_TABLES = {
  profiles: "profiles",
  stores: "stores",
  storeConnections: "store_connections",
  shopifyConnections: "shopify_connections",
  shopifyConnectionSecrets: "shopify_connection_secrets",
  storeWebhookEvents: "store_webhook_events",
} as const;

export type DbTableName = (typeof DB_TABLES)[keyof typeof DB_TABLES];
