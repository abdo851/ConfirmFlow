import type {
  ExternalOrder,
  StoreAdapter,
  StoreConnectionConfig,
  StoreConnectionResult,
} from "@/lib/integrations/adapters/store-adapter";
import { SHOPIFY_PROVIDER_ID } from "./constants";

/**
 * Shopify store adapter.
 * OAuth connection is handled by API routes in M2-B.
 */
export class ShopifyAdapter implements StoreAdapter {
  readonly platform = SHOPIFY_PROVIDER_ID;

  async connect(_config: StoreConnectionConfig): Promise<StoreConnectionResult> {
    void _config;
    return {
      success: false,
      error: "Use /api/integrations/shopify/connect to start Shopify OAuth.",
    };
  }

  async disconnect(_storeId: string): Promise<StoreConnectionResult> {
    void _storeId;
    return {
      success: false,
      error: "Shopify disconnect is not implemented yet.",
    };
  }

  async verifyConnection(_storeId: string): Promise<boolean> {
    void _storeId;
    return false;
  }

  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<boolean> {
    const { verifyShopifyWebhookRequest } = await import(
      "@/lib/integrations/shopify/webhooks/verify-request"
    );
    const secret = process.env.SHOPIFY_API_SECRET;

    if (!secret) {
      return false;
    }

    return verifyShopifyWebhookRequest(headers, body, secret);
  }

  async normalizeOrder(rawPayload: unknown): Promise<ExternalOrder> {
    const { parseShopifyOrderPayload, normalizeShopifyOrder } = await import(
      "@/lib/integrations/shopify/orders"
    );

    const parsed = parseShopifyOrderPayload(
      typeof rawPayload === "string"
        ? rawPayload
        : JSON.stringify(rawPayload),
    );

    if (!parsed.ok) {
      throw new Error(parsed.reason);
    }

    const normalized = normalizeShopifyOrder(parsed.payload, {
      storeId: "unknown",
      ownerId: "unknown",
      receivedAt: new Date(),
    });

    return {
      externalId: normalized.externalOrderId,
      storeId: normalized.storeId,
      rawPayload: normalized,
    };
  }

  async registerWebhooks(storeId: string): Promise<void> {
    const { registerShopifyWebhooksForStore } = await import(
      "@/lib/integrations/shopify/webhooks/register"
    );
    await registerShopifyWebhooksForStore(storeId);
  }
}

export const shopifyAdapter = new ShopifyAdapter();
