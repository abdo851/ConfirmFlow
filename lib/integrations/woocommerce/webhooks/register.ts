import { randomBytes } from "node:crypto";

export interface RegisterOrderWebhooksInput {
  store_url: string;
  consumer_key: string;
  consumer_secret: string;
  delivery_url: string;
  secret: string;
  fetchImpl?: typeof fetch;
}

const ORDER_TOPICS = ["order.created", "order.updated"] as const;

export function generateWooCommerceWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

export function buildWooCommerceWebhookDeliveryUrl(
  appUrl: string,
  connectionId: string,
): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/api/integrations/woocommerce/webhooks?connection=${encodeURIComponent(connectionId)}`;
}

function basicAuthHeader(consumerKey: string, consumerSecret: string): string {
  return `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`;
}

export async function registerOrderWebhooks(
  input: RegisterOrderWebhooksInput,
): Promise<string[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const endpoint = `${input.store_url.replace(/\/$/, "")}/wp-json/wc/v3/webhooks`;
  const ids: string[] = [];

  for (const topic of ORDER_TOPICS) {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(input.consumer_key, input.consumer_secret),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: `Confirma ${topic}`,
        topic,
        delivery_url: input.delivery_url,
        secret: input.secret,
        status: "active",
      }),
    });

    if (!response.ok) {
      throw new Error(`woocommerce_webhook_create_failed:${topic}:${response.status}`);
    }

    const body = (await response.json()) as { id?: number | string };
    if (body.id === undefined || body.id === null || String(body.id).length === 0) {
      throw new Error(`woocommerce_webhook_create_failed:${topic}:missing_id`);
    }

    ids.push(String(body.id));
  }

  return ids;
}
