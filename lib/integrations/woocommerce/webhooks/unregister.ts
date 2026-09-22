import { logger } from "@/lib/logging/logger";

export interface UnregisterWebhooksInput {
  store_url: string;
  consumer_key: string;
  consumer_secret: string;
  webhook_ids: string[];
  fetchImpl?: typeof fetch;
}

function basicAuthHeader(consumerKey: string, consumerSecret: string): string {
  return `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`;
}

export async function unregisterWebhooks(
  input: UnregisterWebhooksInput,
): Promise<void> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const base = input.store_url.replace(/\/$/, "");

  for (const webhookId of input.webhook_ids) {
    if (!webhookId) {
      continue;
    }

    try {
      const response = await fetchImpl(
        `${base}/wp-json/wc/v3/webhooks/${encodeURIComponent(webhookId)}?force=true`,
        {
          method: "DELETE",
          headers: {
            Authorization: basicAuthHeader(
              input.consumer_key,
              input.consumer_secret,
            ),
            Accept: "application/json",
          },
        },
      );

      if (!response.ok && response.status !== 404) {
        logger.error("woocommerce_webhook_unregister_failed", {
          webhookId,
          status: response.status,
        });
      }
    } catch (error) {
      logger.error("woocommerce_webhook_unregister_failed", {
        webhookId,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
