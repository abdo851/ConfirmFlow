import { timingSafeEqual } from "crypto";
import type { CodeNetworkSellerWebhookPayload } from "./types";

export function verifyWebhookSignature(input: {
  rawBody: string;
  headerValue: string | null;
  webhookSecret: string;
}): boolean {
  if (input.headerValue === null || input.webhookSecret.length === 0) {
    return false;
  }

  const provided = Buffer.from(input.headerValue);
  const expected = Buffer.from(input.webhookSecret);
  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

export function parseWebhookPayload(rawBody: string): CodeNetworkSellerWebhookPayload | null {
  try {
    const value = JSON.parse(rawBody) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value as CodeNetworkSellerWebhookPayload;
  } catch {
    return null;
  }
}

export function mapStatusToEventType(
  status: string | undefined,
): "ORDER_CONFIRMED" | "ORDER_DELIVERED" | "ORDER_CANCELLED" | null {
  switch (status) {
    case "CONFIRMED":
      return "ORDER_CONFIRMED";
    case "DELIVERED":
      return "ORDER_DELIVERED";
    case "CANCELLED":
    case "RETURN":
    case "EXPIRED":
    case "DUPLICATED":
    case "WRONG":
      return "ORDER_CANCELLED";
    default:
      return null;
  }
}
