import { createHash } from "crypto";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Meta CAPI email normalization: trim and lowercase. */
export function normalizeMetaEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Meta CAPI phone normalization: digits only, no leading zeros.
 * Caller should supply E.164-style numbers when possible.
 */
export function normalizeMetaPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.replace(/^0+/, "");
}

export function hashMetaEmail(email: string): string {
  const normalized = normalizeMetaEmail(email);
  if (!normalized) {
    throw new Error("email_required");
  }

  return sha256Hex(normalized);
}

export function hashMetaPhone(phone: string): string {
  const normalized = normalizeMetaPhone(phone);
  if (!normalized) {
    throw new Error("phone_required");
  }

  return sha256Hex(normalized);
}

export interface MetaHashedUserData {
  em?: string[];
  ph?: string[];
}

export function hashConversionUserDataForMeta(input: {
  email?: string | null;
  phone?: string | null;
}): MetaHashedUserData {
  const userData: MetaHashedUserData = {};

  if (input.email?.trim()) {
    userData.em = [hashMetaEmail(input.email)];
  }

  if (input.phone?.trim()) {
    userData.ph = [hashMetaPhone(input.phone)];
  }

  return userData;
}
