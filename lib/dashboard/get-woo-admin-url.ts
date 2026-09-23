import "server-only";

import { createUserDatabaseClient } from "@/lib/database/user-client";
import { wooAdminOrderUrl } from "./order-timeline";

export async function getWooAdminUrlForOwner(externalOrderId: string): Promise<string | null> {
  const db = await createUserDatabaseClient();
  const { data } = await db.from("woocommerce_connections").select("store_url").limit(1).maybeSingle();
  if (!data?.store_url) {
    return null;
  }
  return wooAdminOrderUrl(String(data.store_url), externalOrderId);
}
