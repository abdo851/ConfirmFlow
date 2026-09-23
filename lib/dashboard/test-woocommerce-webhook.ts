import "server-only";

import { createUserDatabaseClient } from "@/lib/database/user-client";
import { ingestWooCommerceWebhook } from "@/lib/integrations/woocommerce/webhooks/ingest";

export async function sendWooCommerceWebhookPing(ownerId: string, connectionId?: string): Promise<boolean> {
  const db = await createUserDatabaseClient();
  const { data: stores } = await db.from("stores").select("id").eq("owner_id", ownerId);
  const storeIds = (stores ?? []).map((store) => store.id);
  if (storeIds.length === 0) {
    return false;
  }

  const { data: connections } = await db
    .from("store_connections")
    .select("id")
    .in("store_id", storeIds)
    .eq("provider", "woocommerce");
  const ownedIds = (connections ?? []).map((connection) => connection.id);
  const targetId = connectionId && ownedIds.includes(connectionId) ? connectionId : ownedIds[0];
  if (!targetId) {
    return false;
  }

  const { data: woo } = await db
    .from("woocommerce_connections")
    .select("webhook_ids")
    .eq("store_connection_id", targetId)
    .maybeSingle();
  const webhookId = Array.isArray(woo?.webhook_ids) ? String(woo.webhook_ids[0] ?? "1") : "1";
  const result = await ingestWooCommerceWebhook({
    rawBody: `webhook_id=${webhookId}`,
    headers: { topic: "", deliveryId: "", signature: "" },
    connectionId: targetId,
  });
  return result.httpStatus === 200;
}
