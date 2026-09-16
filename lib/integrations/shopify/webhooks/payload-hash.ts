import { createHash } from "crypto";

export function hashWebhookPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}
