import "server-only";

import { createDatabaseClient } from "@/lib/database/client";
import { buildWooCommerceWebhookDeliveryUrl } from "@/lib/integrations/woocommerce/webhooks/register";
import { getWooCommerceEnv } from "@/lib/integrations/woocommerce/env";
import { getWooCommerceWebhookCleanupTargets } from "@/lib/integrations/woocommerce/persistence";

export interface UserWebhook {
  connection_id: string;
  provider: "woocommerce";
  store_url: string;
  webhook_id: string;
  topic: string;
  delivery_url: string;
  status: "active" | "paused" | "disabled" | "unknown";
  last_delivery_at: string | null;
  last_delivery_status: string | null;
}

const TOPICS = ["order.created", "order.updated"] as const;

export function topicForWebhookIndex(index: number): string {
  return TOPICS[index] ?? "order.updated";
}

export function mapWebhookStatus(value: string | null | undefined): UserWebhook["status"] {
  if (value === "active" || value === "paused" || value === "disabled") {
    return value;
  }
  return "unknown";
}

export function mapStoredWebhooks(input: {
  connectionId: string;
  storeUrl: string;
  webhookIds: string[];
  deliveryUrl: string;
  events?: { topic: string; status: string; receivedAt: string }[];
}): UserWebhook[] {
  return input.webhookIds.filter(Boolean).map((webhookId, index) => {
    const topic = topicForWebhookIndex(index);
    const latest = (input.events ?? []).find((event) => event.topic === topic);
    return {
      connection_id: input.connectionId,
      provider: "woocommerce",
      store_url: input.storeUrl,
      webhook_id: webhookId,
      topic,
      delivery_url: input.deliveryUrl,
      status: "active",
      last_delivery_at: latest?.receivedAt ?? null,
      last_delivery_status: latest?.status ?? null,
    };
  });
}

async function readLiveWebhook(input: {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  webhookId: string;
}): Promise<{ topic?: string; delivery_url?: string; status?: string } | null> {
  const endpoint = `${input.storeUrl.replace(/\/$/, "")}/wp-json/wc/v3/webhooks/${encodeURIComponent(input.webhookId)}`;
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${input.consumerKey}:${input.consumerSecret}`).toString("base64")}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as { topic?: string; delivery_url?: string; status?: string };
  return body;
}

export async function getWebhooksForUser(input: { owner_id: string }): Promise<UserWebhook[]> {
  const db = createDatabaseClient();
  const { data: stores } = await db.from("stores").select("id").eq("owner_id", input.owner_id).eq("platform", "woocommerce");
  const storeIds = (stores ?? []).map((store) => store.id);
  if (storeIds.length === 0) {
    return [];
  }

  const { data: connections } = await db
    .from("store_connections")
    .select("id, store_id")
    .in("store_id", storeIds)
    .eq("provider", "woocommerce")
    .eq("connection_type", "store");

  if (!connections?.length) {
    return [];
  }

  const connectionIds = connections.map((connection) => connection.id);
  const { data: wooRows } = await db
    .from("woocommerce_connections")
    .select("store_connection_id, store_url, webhook_ids")
    .in("store_connection_id", connectionIds);

  const { data: events } = await db
    .from("store_webhook_events")
    .select("store_id, topic, status, received_at")
    .in("store_id", storeIds)
    .eq("provider", "woocommerce")
    .order("received_at", { ascending: false })
    .limit(50);

  let appUrl = "";
  try {
    appUrl = getWooCommerceEnv().NEXT_PUBLIC_APP_URL;
  } catch {
    appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  }

  const rows = (wooRows ?? []).flatMap((row) => {
    const ids = Array.isArray(row.webhook_ids) ? row.webhook_ids.map((id) => String(id)) : [];
    const storeId = connections.find((connection) => connection.id === row.store_connection_id)?.store_id;
    const storeEvents = (events ?? [])
      .filter((event) => event.store_id === storeId)
      .map((event) => ({
        topic: String(event.topic),
        status: String(event.status),
        receivedAt: String(event.received_at),
      }));
    return mapStoredWebhooks({
      connectionId: String(row.store_connection_id),
      storeUrl: String(row.store_url ?? ""),
      webhookIds: ids,
      deliveryUrl: appUrl
        ? buildWooCommerceWebhookDeliveryUrl(appUrl, String(row.store_connection_id))
        : "",
      events: storeEvents,
    });
  });

  try {
    const targets = await getWooCommerceWebhookCleanupTargets(input.owner_id, db);
    await Promise.all(
      rows.map(async (row) => {
        const target = targets.find((item) => item.store_url === row.store_url && item.webhook_ids.includes(row.webhook_id));
        if (!target) {
          return;
        }
        const live = await readLiveWebhook({
          storeUrl: target.store_url,
          consumerKey: target.consumer_key,
          consumerSecret: target.consumer_secret,
          webhookId: row.webhook_id,
        }).catch(() => null);
        if (!live) {
          return;
        }
        if (live.topic) {
          row.topic = live.topic;
        }
        if (live.delivery_url) {
          row.delivery_url = live.delivery_url;
        }
        row.status = mapWebhookStatus(live.status);
      }),
    );
  } catch {
    return rows;
  }

  return rows;
}
