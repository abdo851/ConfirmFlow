# Adapter Architecture

External systems are isolated behind three core adapter interfaces in `lib/integrations/adapters/`.

## StoreAdapter

**Purpose:** Connect to e-commerce platforms and normalize orders.

**Future implementations:**

| Adapter | Location |
|---------|----------|
| ShopifyAdapter | `integrations/stores/shopify/` |
| WooCommerceAdapter | `integrations/stores/woocommerce/` |
| YouCanAdapter | `integrations/stores/youcan/` |

**Responsibilities:**

- Webhook verification (provider-specific)
- Order payload normalization
- Webhook registration

## ConfirmationAdapter

**Purpose:** Handle order confirmation workflows.

**Future implementations:**

| Adapter | Location |
|---------|----------|
| StoreStatusAdapter | `integrations/confirmation/store-status/` |
| ExternalServiceAdapter | `integrations/confirmation/external-service/` |
| CustomWebhookAdapter | `integrations/confirmation/custom-webhook/` |

## MarketingAdapter

**Purpose:** Send conversion events to ad platforms.

**Future implementations:**

| Adapter | Location |
|---------|----------|
| MetaAdapter | `integrations/marketing/meta/` |
| GoogleAdapter | `integrations/marketing/google/` |
| TikTokAdapter | `integrations/marketing/tiktok/` |

## Registration Pattern (Future)

Adapters will be registered in a factory/registry. The core application resolves adapters by platform/provider type without importing concrete implementations in feature code.
