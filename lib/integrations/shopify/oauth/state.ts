import { generateOAuthNonce, signPayload, verifySignedPayload } from "./crypto";

export interface ShopifyOAuthStatePayload {
  nonce: string;
  shop: string;
  issuedAt: number;
}

export function createOAuthState(
  shop: string,
  secret: string,
): { state: string; payload: ShopifyOAuthStatePayload } {
  const payload: ShopifyOAuthStatePayload = {
    nonce: generateOAuthNonce(),
    shop,
    issuedAt: Date.now(),
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return {
    state: signPayload(encoded, secret),
    payload,
  };
}

export function parseOAuthState(
  state: string,
  secret: string,
  maxAgeMs: number,
): ShopifyOAuthStatePayload | null {
  const encoded = verifySignedPayload(state, secret);
  if (!encoded) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as ShopifyOAuthStatePayload;

    if (
      typeof payload.nonce !== "string" ||
      typeof payload.shop !== "string" ||
      typeof payload.issuedAt !== "number"
    ) {
      return null;
    }

    if (Date.now() - payload.issuedAt > maxAgeMs) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
