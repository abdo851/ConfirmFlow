import "server-only";

import { createDatabaseClient } from "@/lib/database/client";
import { getWooCommerceEnv } from "@/lib/integrations/woocommerce/env";
import { decryptSecret } from "@/lib/integrations/woocommerce/oauth/crypto";
import { getWooCommerceWebhookCleanupTargets } from "@/lib/integrations/woocommerce/persistence";
import { registerOrderWebhooks, buildWooCommerceWebhookDeliveryUrl } from "@/lib/integrations/woocommerce/webhooks/register";
import { unregisterWebhooks } from "@/lib/integrations/woocommerce/webhooks/unregister";

export async function reregisterWooCommerceWebhooks(ownerId: string): Promise<{ count: number }> {
  const db = createDatabaseClient();
  const env = getWooCommerceEnv();
  const targets = await getWooCommerceWebhookCleanupTargets(ownerId, db);
  let count = 0;

  for (const target of targets) {
    const { data: connection } = await db
      .from("woocommerce_connections")
      .select("store_connection_id")
      .eq("store_url", target.store_url)
      .maybeSingle();
    if (!connection) {
      continue;
    }

    const { data: secrets } = await db
      .from("woocommerce_connection_secrets")
      .select("encrypted_webhook_secret")
      .eq("store_connection_id", connection.store_connection_id)
      .maybeSingle();
    const webhookSecret = secrets?.encrypted_webhook_secret
      ? decryptSecret(secrets.encrypted_webhook_secret, env.WOOCOMMERCE_SESSION_SECRET)
      : null;
    if (!webhookSecret) {
      throw new Error("missing_webhook_secret");
    }

    if (target.webhook_ids.length > 0) {
      await unregisterWebhooks({
        store_url: target.store_url,
        consumer_key: target.consumer_key,
        consumer_secret: target.consumer_secret,
        webhook_ids: target.webhook_ids,
      });
    }

    const webhookIds = await registerOrderWebhooks({
      store_url: target.store_url,
      consumer_key: target.consumer_key,
      consumer_secret: target.consumer_secret,
      delivery_url: buildWooCommerceWebhookDeliveryUrl(env.NEXT_PUBLIC_APP_URL, connection.store_connection_id),
      secret: webhookSecret,
    });

    const { error } = await db
      .from("woocommerce_connections")
      .update({ webhook_ids: webhookIds })
      .eq("store_connection_id", connection.store_connection_id);
    if (error) {
      throw new Error("unable_to_save_webhook_ids");
    }
    count += webhookIds.length;
  }

  return { count };
}

export async function deleteWooCommerceWebhook(input: {
  ownerId: string;
  connectionId: string;
  webhookId: string;
}): Promise<void> {
  const db = createDatabaseClient();
  const targets = await getWooCommerceWebhookCleanupTargets(input.ownerId, db);
  const { data: woo } = await db
    .from("woocommerce_connections")
    .select("store_url, webhook_ids")
    .eq("store_connection_id", input.connectionId)
    .maybeSingle();
  const target = targets.find((item) => item.store_url === woo?.store_url);
  if (!target || !woo) {
    throw new Error("webhook_not_found");
  }

  await unregisterWebhooks({
    store_url: target.store_url,
    consumer_key: target.consumer_key,
    consumer_secret: target.consumer_secret,
    webhook_ids: [input.webhookId],
  });

  const remaining = (Array.isArray(woo.webhook_ids) ? woo.webhook_ids.map(String) : []).filter(
    (id) => id !== input.webhookId,
  );
  const { error } = await db
    .from("woocommerce_connections")
    .update({ webhook_ids: remaining })
    .eq("store_connection_id", input.connectionId);
  if (error) {
    throw new Error("unable_to_save_webhook_ids");
  }
}
