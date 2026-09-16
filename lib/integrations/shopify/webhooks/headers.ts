import { SHOPIFY_WEBHOOK_HEADERS } from "./constants";

export interface ShopifyWebhookHeaders {
  hmac: string;
  shopDomain: string;
  topic: string;
  webhookId: string;
}

export type ShopifyWebhookHeaderValidationResult =
  | { ok: true; headers: ShopifyWebhookHeaders }
  | { ok: false; reason: string };

function normalizeHeaderMap(
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
}

export function parseShopifyWebhookHeaders(
  headers: Record<string, string>,
): ShopifyWebhookHeaderValidationResult {
  const normalized = normalizeHeaderMap(headers);
  const hmac = normalized[SHOPIFY_WEBHOOK_HEADERS.hmac]?.trim();
  const shopDomain = normalized[SHOPIFY_WEBHOOK_HEADERS.shopDomain]?.trim();
  const topic = normalized[SHOPIFY_WEBHOOK_HEADERS.topic]?.trim();
  const webhookId = normalized[SHOPIFY_WEBHOOK_HEADERS.webhookId]?.trim();

  if (!hmac) {
    return { ok: false, reason: "missing_hmac" };
  }

  if (!shopDomain) {
    return { ok: false, reason: "missing_shop_domain" };
  }

  if (!topic) {
    return { ok: false, reason: "missing_topic" };
  }

  if (!webhookId) {
    return { ok: false, reason: "missing_webhook_id" };
  }

  return {
    ok: true,
    headers: {
      hmac,
      shopDomain,
      topic,
      webhookId,
    },
  };
}
