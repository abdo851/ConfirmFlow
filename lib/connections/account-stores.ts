import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createDatabaseClient } from "@/lib/database/client";

import { STORES_PER_PROVIDER_LIMIT, storeSlotAvailable } from "@/lib/connections/store-limit";

export { STORES_PER_PROVIDER_LIMIT, storeSlotAvailable };

export const STORE_PROVIDERS = ["youcan", "woocommerce", "shopify"] as const;
export type StoreProviderId = (typeof STORE_PROVIDERS)[number];

export interface AccountStoreCard {
  id: string;
  provider: StoreProviderId;
  name: string;
  status: "connected" | "inactive" | "error";
}

export interface AccountStoreSummary {
  stores: AccountStoreCard[];
  counts: Record<StoreProviderId, number>;
}

function asProvider(value: string): StoreProviderId | null {
  if (value === "youcan" || value === "woocommerce" || value === "shopify") {
    return value;
  }
  return null;
}

function cardStatus(value: string): AccountStoreCard["status"] {
  if (value === "active" || value === "connected") {
    return "connected";
  }
  if (value === "error") {
    return "error";
  }
  return "inactive";
}

export async function canAddStoreForUser(
  userId: string,
  platform: StoreProviderId,
  externalId: string,
  db: SupabaseClient = createDatabaseClient(),
): Promise<boolean> {
  const { data, error } = await db
    .from("stores")
    .select("external_store_id")
    .eq("owner_id", userId)
    .eq("platform", platform);

  if (error) {
    throw new Error("Unable to check store limit.");
  }

  const ids = (data ?? [])
    .map((row) => (typeof row.external_store_id === "string" ? row.external_store_id : ""))
    .filter((id) => id.length > 0);

  return storeSlotAvailable(ids, externalId);
}

export async function listAccountStores(): Promise<AccountStoreSummary> {
  const emptyCounts: Record<StoreProviderId, number> = {
    youcan: 0,
    woocommerce: 0,
    shopify: 0,
  };
  const user = await getAuthenticatedUser();
  if (!user) {
    return { stores: [], counts: emptyCounts };
  }

  const db = createDatabaseClient();
  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id, name, platform, external_store_id, created_at")
    .eq("owner_id", user.id)
    .in("platform", [...STORE_PROVIDERS])
    .order("created_at", { ascending: true });

  if (storesError || !stores?.length) {
    return { stores: [], counts: emptyCounts };
  }

  const storeIds = stores.map((store) => store.id);
  const { data: connections, error: connectionError } = await db
    .from("store_connections")
    .select("id, store_id, provider, status")
    .in("store_id", storeIds)
    .eq("connection_type", "store");

  if (connectionError) {
    throw new Error("Unable to load store connections.");
  }

  const connectionIds = (connections ?? []).map((connection) => connection.id);
  const [youcanRows, wooRows, shopifyRows] = await Promise.all([
    connectionIds.length
      ? db.from("youcan_connections").select("store_connection_id, store_slug").in("store_connection_id", connectionIds)
      : Promise.resolve({ data: [] as Array<{ store_connection_id: string; store_slug: string }> }),
    connectionIds.length
      ? db.from("woocommerce_connections").select("store_connection_id, store_url").in("store_connection_id", connectionIds)
      : Promise.resolve({ data: [] as Array<{ store_connection_id: string; store_url: string }> }),
    connectionIds.length
      ? db.from("shopify_connections").select("store_connection_id, shop_domain").in("store_connection_id", connectionIds)
      : Promise.resolve({ data: [] as Array<{ store_connection_id: string; shop_domain: string }> }),
  ]);

  const youcanName = new Map((youcanRows.data ?? []).map((row) => [row.store_connection_id, row.store_slug]));
  const wooName = new Map((wooRows.data ?? []).map((row) => [row.store_connection_id, row.store_url]));
  const shopifyName = new Map((shopifyRows.data ?? []).map((row) => [row.store_connection_id, row.shop_domain]));
  const connectionByStore = new Map((connections ?? []).map((connection) => [connection.store_id, connection]));

  const cards: AccountStoreCard[] = [];
  for (const store of stores) {
    const provider = asProvider(store.platform);
    const connection = connectionByStore.get(store.id);
    if (!provider || !connection || connection.provider !== provider) {
      continue;
    }
    const name =
      youcanName.get(connection.id) ??
      wooName.get(connection.id) ??
      shopifyName.get(connection.id) ??
      store.name ??
      store.external_store_id ??
      provider;
    cards.push({
      id: store.id,
      provider,
      name,
      status: cardStatus(connection.status),
    });
    emptyCounts[provider] += 1;
  }

  return { stores: cards, counts: emptyCounts };
}
