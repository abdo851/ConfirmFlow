import { createHmac, timingSafeEqual } from "crypto";

export function verifyShopifyCallbackHmac(
  queryParams: Record<string, string>,
  secret: string,
): boolean {
  const hmac = queryParams.hmac;
  if (!hmac) {
    return false;
  }

  const message = Object.entries(queryParams)
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const digest = createHmac("sha256", secret).update(message).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(hmac, "hex"));
  } catch {
    return false;
  }
}

export function validateCallbackParameters(params: {
  code?: string | null;
  shop?: string | null;
  state?: string | null;
  hmac?: string | null;
}): { valid: boolean; reason?: string } {
  if (!params.code) {
    return { valid: false, reason: "missing_code" };
  }

  if (!params.shop) {
    return { valid: false, reason: "missing_shop" };
  }

  if (!params.state) {
    return { valid: false, reason: "missing_state" };
  }

  if (!params.hmac) {
    return { valid: false, reason: "missing_hmac" };
  }

  return { valid: true };
}
