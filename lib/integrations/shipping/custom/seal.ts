import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from "crypto";

const SALT = "confirma-custom-shipping";

export function customShippingKeyMaterial(): string {
  const dedicated = process.env.SHIPPING_SESSION_SECRET?.trim();
  const fallback = process.env.YOUCAN_SESSION_SECRET?.trim();
  const secret = dedicated || fallback;
  if (!secret) {
    throw new Error("shipping_key_missing");
  }
  return secret;
}

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SALT, 32);
}

export function sealValue(plaintext: string, secret = customShippingKeyMaterial()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function openValue(packed: string, secret = customShippingKeyMaterial()): string {
  const [ivPart, tagPart, dataPart] = packed.split(".");
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("seal_invalid");
  }
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(ivPart, "base64"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(dataPart, "base64")), decipher.final()]);
  return plain.toString("utf8");
}

export function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}
