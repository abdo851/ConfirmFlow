import { createHmac, timingSafeEqual } from "crypto";

export function signYouCanWebhookBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

export function verifyYouCanWebhookHmac(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }

  const generated = signYouCanWebhookBody(rawBody, secret);

  try {
    const expected = Buffer.from(generated, "utf8");
    const actual = Buffer.from(signatureHeader, "utf8");

    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
