import { createHmac, timingSafeEqual } from "node:crypto";

export function signWooCommerceWebhookBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

export function verifyWooCommerceSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }

  const generated = signWooCommerceWebhookBody(rawBody, secret);

  try {
    const expected = Buffer.from(generated, "utf8");
    const actual = Buffer.from(signatureHeader.trim(), "utf8");

    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
