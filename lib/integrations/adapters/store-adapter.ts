/**
 * StoreAdapter — abstraction for e-commerce store platforms.
 * Future implementations: ShopifyAdapter, WooCommerceAdapter, YouCanAdapter
 */

export type StorePlatform = "shopify" | "woocommerce" | "youcan";

export interface StoreConnectionConfig {
  storeId: string;
  platform: StorePlatform;
  /** Opaque credentials reference — never store raw secrets in application code */
  credentialsRef: string;
}

export interface ExternalOrder {
  externalId: string;
  storeId: string;
  rawPayload: unknown;
}

export interface StoreAdapter {
  readonly platform: StorePlatform;

  /** Verify incoming store webhook authenticity (provider-specific in future milestones) */
  verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<boolean>;

  /** Normalize a platform order payload into the internal order shape */
  normalizeOrder(rawPayload: unknown): Promise<ExternalOrder>;

  /** Register webhooks with the store platform */
  registerWebhooks(storeId: string): Promise<void>;
}
