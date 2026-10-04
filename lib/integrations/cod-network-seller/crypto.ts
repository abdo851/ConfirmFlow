import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const SALT = "confirma-cod-network-seller-token";

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SALT, 32);
}

function encryptionSecret(): string {
  const dedicated = process.env.SHIPPING_SESSION_SECRET?.trim();
  if (dedicated && dedicated.length >= 32) {
    return dedicated;
  }

  const fallback = process.env.YOUCAN_SESSION_SECRET?.trim();
  if (fallback && fallback.length >= 32) {
    return fallback;
  }

  throw new Error("shipping_key_missing");
}

export function sealToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(encryptionSecret()), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function unsealToken(ciphertext: string): string {
  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw new Error("invalid_ciphertext");
    }

    const decipher = createDecipheriv("aes-256-gcm", deriveKey(encryptionSecret()), Buffer.from(parts[0], "base64"));
    decipher.setAuthTag(Buffer.from(parts[1], "base64"));
    return Buffer.concat([decipher.update(Buffer.from(parts[2], "base64")), decipher.final()]).toString("utf8");
  } catch (error) {
    if (error instanceof Error && error.message === "shipping_key_missing") {
      throw error;
    }
    throw new Error("invalid_ciphertext");
  }
}
