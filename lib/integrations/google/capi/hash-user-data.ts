import { createHash } from "crypto";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function normalizeGoogleEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeGooglePhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.replace(/^0+/, "");
}

export function hashGoogleEmail(email: string): string {
  const normalized = normalizeGoogleEmail(email);
  if (!normalized) {
    throw new Error("email_required");
  }

  return sha256Hex(normalized);
}

export function hashGooglePhone(phone: string): string {
  const normalized = normalizeGooglePhone(phone);
  if (!normalized) {
    throw new Error("phone_required");
  }

  return sha256Hex(normalized);
}
