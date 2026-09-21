import type { WooCommerceCallbackCredentials } from "../types";

export type WooCommerceCallbackVerification =
  | { ok: true; credentials: WooCommerceCallbackCredentials }
  | { ok: false; error: string };

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

export function verifyWooCommerceCallbackPayload(
  body: unknown,
): WooCommerceCallbackVerification {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;
  const consumerKey = readString(record.consumer_key);
  const consumerSecret = readString(record.consumer_secret);
  const userId = readString(record.user_id);
  const keyId = readString(record.key_id) ?? "unknown";
  const keyPermissions = readString(record.key_permissions);

  if (!consumerKey || !consumerSecret) {
    return { ok: false, error: "missing_credentials" };
  }

  if (!userId) {
    return { ok: false, error: "missing_user_id" };
  }

  return {
    ok: true,
    credentials: {
      keyId,
      userId,
      consumerKey,
      consumerSecret,
      keyPermissions,
    },
  };
}
