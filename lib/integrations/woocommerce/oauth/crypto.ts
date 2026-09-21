import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

const SIGNATURE_SEPARATOR = ".";
const ENCRYPTION_VERSION = "v1";

function deriveKey(secret: string, salt: string): Buffer {
  return scryptSync(secret, salt, 32);
}

export function signPayload(payload: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}${SIGNATURE_SEPARATOR}${signature}`;
}

export function verifySignedPayload(
  signedValue: string,
  secret: string,
): string | null {
  const separatorIndex = signedValue.lastIndexOf(SIGNATURE_SEPARATOR);
  if (separatorIndex === -1) {
    return null;
  }

  const payload = signedValue.slice(0, separatorIndex);
  const signature = signedValue.slice(separatorIndex + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    const valid = timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    );
    return valid ? payload : null;
  } catch {
    return null;
  }
}

export function encryptSecret(plaintext: string, secret: string): string {
  const iv = randomBytes(12);
  const key = deriveKey(secret, "confirma-woocommerce-token");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptSecret(ciphertext: string, secret: string): string | null {
  const [version, ivValue, authTagValue, encryptedValue] = ciphertext.split(":");
  if (
    version !== ENCRYPTION_VERSION ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue
  ) {
    return null;
  }

  try {
    const key = deriveKey(secret, "confirma-woocommerce-token");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function generateOAuthNonce(): string {
  return randomBytes(32).toString("base64url");
}
