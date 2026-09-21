import { generateOAuthNonce, signPayload, verifySignedPayload } from "./crypto";
import type { WooCommerceOAuthStatePayload } from "../types";

export function signStoreUrl(
  storeUrl: string,
  secret: string,
  userId: string,
): string {
  const payload: WooCommerceOAuthStatePayload = {
    nonce: generateOAuthNonce(),
    storeUrl,
    userId,
    issuedAt: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return signPayload(encoded, secret);
}

export function verifyState(
  token: string,
  secret: string,
  maxAgeMs: number,
): WooCommerceOAuthStatePayload | null {
  const encoded = verifySignedPayload(token, secret);
  if (!encoded) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as WooCommerceOAuthStatePayload;

    if (
      typeof payload.nonce !== "string" ||
      typeof payload.storeUrl !== "string" ||
      typeof payload.userId !== "string" ||
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
