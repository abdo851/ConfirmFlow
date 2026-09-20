import {
  youCanWebhookEnvelopeSchema,
  type YouCanOrderWebhookPayload,
  type YouCanWebhookEnvelope,
} from "./schema";

export type ParseYouCanOrderPayloadResult =
  | { ok: true; envelope: YouCanWebhookEnvelope; payload: YouCanOrderWebhookPayload }
  | { ok: false; reason: string };

export function parseYouCanOrderPayload(
  rawBody: string,
): ParseYouCanOrderPayloadResult {
  let json: unknown;

  try {
    json = JSON.parse(rawBody);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  const parsed = youCanWebhookEnvelopeSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, reason: "invalid_order_payload" };
  }

  return {
    ok: true,
    envelope: parsed.data,
    payload: parsed.data.data,
  };
}

export function extractYouCanStoreIdFromBody(rawBody: string): string | null {
  try {
    const json = JSON.parse(rawBody) as { data?: { store_id?: string } };
    const storeId = json.data?.store_id;
    return typeof storeId === "string" && storeId.trim().length > 0
      ? storeId
      : null;
  } catch {
    return null;
  }
}
