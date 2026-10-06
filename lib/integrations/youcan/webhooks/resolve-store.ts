import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedYouCanStore {
  storeId: string;
  ownerId: string;
  storeSlug: string;
}

async function backfillYouCanStoreIdIfUnique(
  youcanStoreId: string,
  db: SupabaseClient,
): Promise<boolean> {
  const { data: pendingConnections, error } = await db
    .from("youcan_connections")
    .select("store_connection_id")
    .is("youcan_store_id", null);

  if (error || !pendingConnections || pendingConnections.length !== 1) {
    return false;
  }

  const { error: updateError } = await db
    .from("youcan_connections")
    .update({ youcan_store_id: youcanStoreId })
    .eq("store_connection_id", pendingConnections[0].store_connection_id);

  return !updateError;
}

export async function resolveYouCanStoreByStoreId(
  youcanStoreId: string,
  db: SupabaseClient,
): Promise<ResolvedYouCanStore | null> {
  if (!youcanStoreId.trim()) {
    return null;
  }

  const { data: youCanConnection, error: youCanError } = await db
    .from("youcan_connections")
    .select("store_connection_id, store_slug")
    .eq("youcan_store_id", youcanStoreId)
    .maybeSingle();

  if (youCanError || !youCanConnection) {
    return null;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("store_id, status")
    .eq("id", youCanConnection.store_connection_id)
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
    storeSlug: youCanConnection.store_slug,
  };
}

export async function resolveOrBackfillYouCanStoreByStoreId(
  youcanStoreId: string,
  db: SupabaseClient,
): Promise<ResolvedYouCanStore | null> {
  console.log(`[youcan webhook] resolve store_id=${youcanStoreId}`);
  const existing = await resolveYouCanStoreByStoreId(youcanStoreId, db);
  if (existing) {
    console.log(
      `[youcan webhook] store found id=${existing.storeId ?? "none"} owner=${existing.ownerId ?? "none"}`,
    );
    return existing;
  }

  const backfilled = await backfillYouCanStoreIdIfUnique(youcanStoreId, db);
  if (!backfilled) {
    return null;
  }

  const store = await resolveYouCanStoreByStoreId(youcanStoreId, db);
  console.log(
    `[youcan webhook] store found id=${store?.storeId ?? "none"} owner=${store?.ownerId ?? "none"}`,
  );
  return store;
}

export async function resolveYouCanStoreBySlug(
  storeSlug: string,
  db: SupabaseClient,
): Promise<ResolvedYouCanStore | null> {
  const normalized = storeSlug.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const { data: youCanConnection, error: youCanError } = await db
    .from("youcan_connections")
    .select("store_connection_id, store_slug")
    .eq("store_slug", normalized)
    .maybeSingle();

  if (youCanError || !youCanConnection) {
    return null;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("store_id, status")
    .eq("id", youCanConnection.store_connection_id)
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
    storeSlug: youCanConnection.store_slug,
  };
}
