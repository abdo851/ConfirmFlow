import { parseShopifyWebhookHeaders } from "./headers";
import { verifyShopifyWebhookHmac } from "./hmac";

export function verifyShopifyWebhookRequest(
  headers: Record<string, string>,
  rawBody: string,
  secret: string,
): boolean {
  const parsed = parseShopifyWebhookHeaders(headers);
  if (!parsed.ok) {
    return false;
  }

  return verifyShopifyWebhookHmac(rawBody, parsed.headers.hmac, secret);
}
