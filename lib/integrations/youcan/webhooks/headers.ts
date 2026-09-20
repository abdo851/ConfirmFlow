import {
  YOUCAN_DELIVERY_ID_HEADER,
  YOUCAN_SIGNATURE_HEADER,
  YOUCAN_TOPIC_HEADER,
} from "./constants";

export interface YouCanWebhookHeaders {
  signature: string;
  topic: string;
  deliveryId: string;
}

function normalizeHeaderMap(
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
}

export function parseYouCanWebhookHeaders(
  headers: Record<string, string>,
):
  | { ok: true; headers: YouCanWebhookHeaders }
  | { ok: false; reason: string } {
  const normalized = normalizeHeaderMap(headers);
  const signature = normalized[YOUCAN_SIGNATURE_HEADER]?.trim();
  const topic = normalized[YOUCAN_TOPIC_HEADER]?.trim();
  const deliveryId = normalized[YOUCAN_DELIVERY_ID_HEADER]?.trim();

  if (!signature) {
    return { ok: false, reason: "missing_signature" };
  }

  if (!topic) {
    return { ok: false, reason: "missing_topic" };
  }

  if (!deliveryId) {
    return { ok: false, reason: "missing_delivery_id" };
  }

  return {
    ok: true,
    headers: {
      signature,
      topic,
      deliveryId,
    },
  };
}
