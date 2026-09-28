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

const CREATE_TOPICS = [
  "order.created",
  "order.updated",
  "order.cancelled",
  "order.fulfilled",
  "order.paid",
] as const;

export async function createWooCommerceWebhook(input: {
  ownerId: string;
  topic: string;
  targetUrl: string;
  active: boolean;
}): Promise<{
  connection_id: string;
  webhook_id: string;
  topic: string;
  delivery_url: string;
  status: "active" | "paused";
}> {
  if (!CREATE_TOPICS.includes(input.topic as (typeof CREATE_TOPICS)[number])) {
    throw new Error("invalid_topic");
  }

  let target: URL;
  try {
    target = new URL(input.targetUrl.trim());
  } catch {
    throw new Error("invalid_url");
  }
  if (target.protocol !== "https:" || target.username || target.password) {
    throw new Error("invalid_url");
  }

  const db = createDatabaseClient();
  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", input.ownerId)
    .eq("platform", "woocommerce");
  if (storesError) {
    throw new Error("create_failed");
  }
  const storeIds = (stores ?? []).map((store) => store.id);
  if (storeIds.length === 0) {
    throw new Error("no_store");
  }

  const { data: connections, error: connectionsError } = await db
    .from("store_connections")
    .select("id")
    .in("store_id", storeIds)
    .eq("provider", "woocommerce")
    .eq("connection_type", "store");
  if (connectionsError) {
    throw new Error("create_failed");
  }
  const connectionIds = (connections ?? []).map((connection) => connection.id);
  if (connectionIds.length === 0) {
    throw new Error("no_store");
  }
  if (connectionIds.length > 1) {
    throw new Error("store_required");
  }

  const connectionId = connectionIds[0];
  const env = getWooCommerceEnv();
  const targets = await getWooCommerceWebhookCleanupTargets(input.ownerId, db);
  const { data: woo } = await db
    .from("woocommerce_connections")
    .select("store_url, webhook_ids")
    .eq("store_connection_id", connectionId)
    .maybeSingle();
  const match = targets.find((item) => item.store_url === woo?.store_url);
  if (!match || !woo) {
    throw new Error("no_store");
  }

  const { data: secrets } = await db
    .from("woocommerce_connection_secrets")
    .select("encrypted_webhook_secret")
    .eq("store_connection_id", connectionId)
    .maybeSingle();
  const webhookSecret = secrets?.encrypted_webhook_secret
    ? decryptSecret(secrets.encrypted_webhook_secret, env.WOOCOMMERCE_SESSION_SECRET)
    : null;
  if (!webhookSecret) {
    throw new Error("create_failed");
  }

  const status = input.active ? "active" : "paused";
  const response = await fetch(`${match.store_url.replace(/\/$/, "")}/wp-json/wc/v3/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${match.consumer_key}:${match.consumer_secret}`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: `Confirma ${input.topic}`,
      topic: input.topic,
      delivery_url: target.toString(),
      secret: webhookSecret,
      status,
    }),
  });

  if (!response.ok) {
    throw new Error("create_failed");
  }

  const body = (await response.json()) as { id?: number | string };
  if (body.id === undefined || body.id === null || String(body.id).length === 0) {
    throw new Error("create_failed");
  }

  const webhookId = String(body.id);
  const existing = Array.isArray(woo.webhook_ids) ? woo.webhook_ids.map(String) : [];
  const { error: saveError } = await db
    .from("woocommerce_connections")
    .update({ webhook_ids: [...existing, webhookId] })
    .eq("store_connection_id", connectionId);
  if (saveError) {
    throw new Error("create_failed");
  }

  return {
    connection_id: connectionId,
    webhook_id: webhookId,
    topic: input.topic,
    delivery_url: target.toString(),
    status,
  };
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
