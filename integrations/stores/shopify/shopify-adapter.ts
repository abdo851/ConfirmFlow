import type {
  ExternalOrder,
  StoreAdapter,
  StoreConnectionConfig,
  StoreConnectionResult,
} from "@/lib/integrations/adapters/store-adapter";
import { SHOPIFY_FOUNDATION_MESSAGE, SHOPIFY_PROVIDER_ID } from "./constants";

function notAvailableResult(): StoreConnectionResult {
  return {
    success: false,
    error: SHOPIFY_FOUNDATION_MESSAGE,
  };
}

/**
 * Shopify store adapter foundation.
 * Does not perform real Shopify API or OAuth calls in M2-A.
 */
export class ShopifyAdapter implements StoreAdapter {
  readonly platform = SHOPIFY_PROVIDER_ID;

  async connect(config: StoreConnectionConfig): Promise<StoreConnectionResult> {
    void config;
    return notAvailableResult();
  }

  async disconnect(storeId: string): Promise<StoreConnectionResult> {
    void storeId;
    return notAvailableResult();
  }

  async verifyConnection(storeId: string): Promise<boolean> {
    void storeId;
    return false;
  }

  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<boolean> {
    void headers;
    void body;
    return false;
  }

  async normalizeOrder(rawPayload: unknown): Promise<ExternalOrder> {
    void rawPayload;
    throw new Error("Shopify order normalization is not implemented in M2-A.");
  }

  async registerWebhooks(storeId: string): Promise<void> {
    void storeId;
    throw new Error("Shopify webhook registration is not implemented in M2-A.");
  }
}

export const shopifyAdapter = new ShopifyAdapter();
