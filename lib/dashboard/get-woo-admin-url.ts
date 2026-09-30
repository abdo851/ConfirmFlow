import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";
import { wooAdminOrderUrl } from "./order-timeline";

export async function getWooAdminUrlForOwner(externalOrderId: string): Promise<string | null> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }

  const db = await createUserDatabaseClient();
  const { data: stores } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .eq("platform", "woocommerce");
  const storeIds = (stores ?? []).map((store) => store.id);
  if (storeIds.length === 0) {
    return null;
  }

  const { data: connections } = await db
    .from("store_connections")
    .select("id")
    .in("store_id", storeIds)
    .eq("provider", "woocommerce")
    .eq("connection_type", "store");
  const connectionIds = (connections ?? []).map((connection) => connection.id);
  if (connectionIds.length === 0) {
    return null;
  }

  const { data } = await db
    .from("woocommerce_connections")
    .select("store_url")
    .in("store_connection_id", connectionIds)
    .limit(1)
    .maybeSingle();
  if (!data?.store_url) {
    return null;
  }
  return wooAdminOrderUrl(String(data.store_url), externalOrderId);
}
