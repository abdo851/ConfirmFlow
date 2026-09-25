import { createHash } from "crypto";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function normalizeTikTokEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeTikTokPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.replace(/^0+/, "");
}

export function hashTikTokEmail(email: string): string {
  const normalized = normalizeTikTokEmail(email);
  if (!normalized) {
    throw new Error("email_required");
  }

  return sha256Hex(normalized);
}

export function hashTikTokPhone(phone: string): string {
  const normalized = normalizeTikTokPhone(phone);
  if (!normalized) {
    throw new Error("phone_required");
  }

  return sha256Hex(normalized);
}
