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

export interface StoreConnectionResult {
  success: boolean;
  error?: string;
}

export interface StoreAdapter {
  readonly platform: StorePlatform;

  /** Establish a store connection — real OAuth/API in future milestones */
  connect(config: StoreConnectionConfig): Promise<StoreConnectionResult>;

  /** Remove a store connection */
  disconnect(storeId: string): Promise<StoreConnectionResult>;

  /** Verify whether an existing store connection is valid */
  verifyConnection(storeId: string): Promise<boolean>;

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
