import { shopifyOrderWebhookSchema } from "./schema";

export type ParseShopifyOrderResult =
  | { ok: true; payload: ReturnType<typeof shopifyOrderWebhookSchema.parse> }
  | { ok: false; reason: string };

export function parseShopifyOrderPayload(rawBody: string): ParseShopifyOrderResult {
  let json: unknown;

  try {
    json = JSON.parse(rawBody);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  const parsed = shopifyOrderWebhookSchema.safeParse(json);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      reason: firstIssue?.message ?? "invalid_order_payload",
    };
  }

  return { ok: true, payload: parsed.data };
}
