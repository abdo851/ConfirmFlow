import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeShopDomain } from "@/lib/integrations/shopify/oauth/shop-domain";

export interface ResolvedShopifyStore {
  storeId: string;
  ownerId: string;
  shopDomain: string;
}

export async function resolveShopifyStoreByDomain(
  shopDomainInput: string,
  db: SupabaseClient,
): Promise<ResolvedShopifyStore | null> {
  const shopDomain = normalizeShopDomain(shopDomainInput);
  if (!shopDomain) {
    return null;
  }

  const { data: shopifyConnection, error: shopifyError } = await db
    .from("shopify_connections")
    .select("store_connection_id")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (shopifyError || !shopifyConnection) {
    return null;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("store_id, status")
    .eq("id", shopifyConnection.store_connection_id)
    .maybeSingle();

  if (connectionError || !storeConnection || storeConnection.status !== "active") {
    return null;
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("id, owner_id")
    .eq("id", storeConnection.store_id)
    .maybeSingle();

  if (storeError || !store) {
    return null;
  }

  return {
    storeId: store.id,
    ownerId: store.owner_id,
    shopDomain,
  };
}
