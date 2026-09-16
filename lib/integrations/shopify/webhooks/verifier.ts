import type { WebhookVerifier } from "@/lib/webhooks";
import { parseShopifyWebhookHeaders } from "./headers";
import { verifyShopifyWebhookHmac } from "./hmac";

export class ShopifyWebhookVerifier implements WebhookVerifier {
  constructor(private readonly secret: string) {}

  async verify(headers: Record<string, string>, rawBody: string) {
    const parsed = parseShopifyWebhookHeaders(headers);
    if (!parsed.ok) {
      return { valid: false, reason: parsed.reason };
    }

    if (!verifyShopifyWebhookHmac(rawBody, parsed.headers.hmac, this.secret)) {
      return { valid: false, reason: "invalid_hmac" };
    }

    return { valid: true };
  }
}
