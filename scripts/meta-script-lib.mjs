import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ENCRYPTION_VERSION = "v1";

function deriveKey(secret, salt) {
  return scryptSync(secret, salt, 32);
}

export function encryptAccessToken(plaintext, secret) {
  const iv = randomBytes(12);
  const key = deriveKey(secret, "confirma-shopify-token");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    ENCRYPTION_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptAccessToken(ciphertext, secret) {
  const [version, ivValue, authTagValue, encryptedValue] = ciphertext.split(":");
  if (version !== ENCRYPTION_VERSION || !ivValue || !authTagValue || !encryptedValue) {
    return null;
  }

  try {
    const key = deriveKey(secret, "confirma-shopify-token");
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function redactSecrets(value) {
  return String(value ?? "").replace(/EAA[A-Za-z0-9]+/g, "[REDACTED]").replace(/access_token=[^&\s]+/gi, "access_token=[REDACTED]");
}

export function classifyMetaVerification({ meStatus, pixelStatus, pixelId, responsePixelId }) {
  if (meStatus === 401 || meStatus === 403) {
    return { status: "failed", message: "Meta access token is invalid or expired." };
  }
  if (meStatus !== 200) {
    return { status: "failed", message: "Unable to verify Meta access token." };
  }
  if (pixelStatus === 200 && String(responsePixelId) === String(pixelId).trim()) {
    return { status: "verified" };
  }
  if (pixelStatus === 200) {
    return {
      status: "identifier_not_verified",
      message: "Meta credentials are valid, but the configured Pixel/Dataset identifier could not be confirmed.",
    };
  }
  if (pixelStatus === 404 || pixelStatus === 403) {
    return {
      status: "identifier_not_verified",
      message: "Meta credentials are valid, but the configured Pixel/Dataset is not accessible with this token.",
    };
  }
  return {
    status: "credentials_valid",
    message: "Meta credentials appear valid, but Pixel/Dataset access could not be fully verified.",
  };
}

export function verificationTimestamp(status, now = new Date()) {
  if (status === "verified" || status === "credentials_valid" || status === "identifier_not_verified") {
    return now.toISOString();
  }
  return null;
}
