import "server-only";

import { createDatabaseClient } from "@/lib/database/client";

export async function disconnectTikTokConnection(ownerId: string): Promise<void> {
  const db = createDatabaseClient();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", ownerId);

  if (storesError || !stores?.length) {
    return;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id")
    .in(
      "store_id",
      stores.map((store) => store.id),
    )
    .eq("connection_type", "marketing")
    .eq("provider", "tiktok")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return;
  }

  await db
    .from("tiktok_connection_secrets")
    .delete()
    .eq("store_connection_id", storeConnection.id);

  await db.from("tiktok_connections").delete().eq("store_connection_id", storeConnection.id);

  await db.from("store_connections").delete().eq("id", storeConnection.id);
}
