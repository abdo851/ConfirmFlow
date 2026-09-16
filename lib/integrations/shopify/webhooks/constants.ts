export const SHOPIFY_WEBHOOK_HEADERS = {
  hmac: "x-shopify-hmac-sha256",
  shopDomain: "x-shopify-shop-domain",
  topic: "x-shopify-topic",
  webhookId: "x-shopify-webhook-id",
} as const;

export const SHOPIFY_WEBHOOK_PROVIDER = "shopify" as const;

/** Future order topic recognized in M3-A without order persistence. */
export const SHOPIFY_ORDER_CREATE_TOPIC = "orders/create";
