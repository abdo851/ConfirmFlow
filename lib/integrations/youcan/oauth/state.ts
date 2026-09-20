import { generateOAuthNonce, signPayload, verifySignedPayload } from "./crypto";

export interface YouCanOAuthStatePayload {
  nonce: string;
  storeSlug: string;
  issuedAt: number;
}

export function createOAuthState(
  storeSlug: string,
  secret: string,
): { state: string; payload: YouCanOAuthStatePayload } {
  const payload: YouCanOAuthStatePayload = {
    nonce: generateOAuthNonce(),
    storeSlug,
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
): YouCanOAuthStatePayload | null {
  const encoded = verifySignedPayload(state, secret);
  if (!encoded) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as YouCanOAuthStatePayload;

    if (
      typeof payload.nonce !== "string" ||
      typeof payload.storeSlug !== "string" ||
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
