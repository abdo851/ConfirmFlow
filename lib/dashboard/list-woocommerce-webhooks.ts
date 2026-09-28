import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";

export interface ListedStoreWebhooks {
  storeUrl: string;
  updatedAt: string | null;
  webhookIds: string[];
}

export async function listWooCommerceWebhooksForCurrentUser(): Promise<ListedStoreWebhooks[]> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return [];
    }

    const db = await createUserDatabaseClient();
    const { data: stores } = await db
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .eq("platform", "woocommerce");
    const storeIds = (stores ?? []).map((store) => store.id);
    if (storeIds.length === 0) {
      return [];
    }

    const { data: connections } = await db
      .from("store_connections")
      .select("id")
      .in("store_id", storeIds)
      .eq("provider", "woocommerce")
      .eq("connection_type", "store");
    const connectionIds = (connections ?? []).map((connection) => connection.id);
    if (connectionIds.length === 0) {
      return [];
    }

    const { data, error } = await db
      .from("woocommerce_connections")
      .select("store_url, webhook_ids, updated_at")
      .in("store_connection_id", connectionIds);

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      storeUrl: String(row.store_url ?? ""),
      updatedAt: row.updated_at ? String(row.updated_at) : null,
      webhookIds: Array.isArray(row.webhook_ids) ? row.webhook_ids.map((id) => String(id)) : [],
    }));
  } catch {
    return [];
  }
}
