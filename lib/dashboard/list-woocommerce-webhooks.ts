import "server-only";

import { createUserDatabaseClient } from "@/lib/database/user-client";

export interface ListedStoreWebhooks {
  storeUrl: string;
  updatedAt: string | null;
  webhookIds: string[];
}

export async function listWooCommerceWebhooksForCurrentUser(): Promise<ListedStoreWebhooks[]> {
  try {
    const db = await createUserDatabaseClient();
    const { data, error } = await db
      .from("woocommerce_connections")
      .select("store_url, webhook_ids, updated_at");

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
