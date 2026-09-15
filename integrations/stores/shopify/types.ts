/**
 * Shopify-specific types — isolated from generic store contracts.
 * Credentials and OAuth tokens belong in future persistence milestones.
 */

export interface ShopifyShopReference {
  /** Shopify shop domain, e.g. example.myshopify.com */
  shopDomain: string;
}

export interface ShopifyAdapterConfig {
  storeId: string;
  shop: ShopifyShopReference;
}
