import { createHmac, timingSafeEqual } from "crypto";

export function signShopifyWebhookBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

export function verifyShopifyWebhookHmac(
  rawBody: string,
  hmacHeader: string,
  secret: string,
): boolean {
  if (!rawBody || !hmacHeader || !secret) {
    return false;
  }

  const generated = signShopifyWebhookBody(rawBody, secret);

  try {
    const expected = Buffer.from(generated, "utf8");
    const actual = Buffer.from(hmacHeader, "utf8");

    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
