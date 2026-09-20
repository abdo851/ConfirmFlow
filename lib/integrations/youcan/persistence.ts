import type { SupabaseClient } from "@supabase/supabase-js";
import { toConnectionStatus } from "@/lib/database/connection-status";
import { createDatabaseClient } from "@/lib/database/client";
import { getYouCanOAuthEnv } from "@/lib/integrations/youcan/env";
import { encryptSecret, decryptSecret } from "@/lib/integrations/youcan/oauth";
import type { YouCanConnectionPublicState } from "@/lib/integrations/youcan/session/types";
import { unregisterYouCanOrderCreatedWebhook } from "@/lib/integrations/youcan/webhooks/register";

export class YouCanPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouCanPersistenceError";
  }
}

export function buildYouCanStoreName(storeSlug: string): string {
  return storeSlug;
}

export async function assertYouCanStoreAvailableForUser(
  db: SupabaseClient,
  storeSlug: string,
  userId: string,
): Promise<void> {
  const { data: existingYouCan, error: youCanError } = await db
    .from("youcan_connections")
    .select("store_connection_id")
    .eq("store_slug", storeSlug)
    .maybeSingle();

  if (youCanError) {
    throw new YouCanPersistenceError("Unable to verify YouCan store ownership.");
  }

  if (!existingYouCan) {
    return;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("store_id")
    .eq("id", existingYouCan.store_connection_id)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    throw new YouCanPersistenceError("Unable to verify YouCan store ownership.");
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("owner_id")
    .eq("id", storeConnection.store_id)
    .maybeSingle();

  if (storeError || !store) {
    throw new YouCanPersistenceError("Unable to verify YouCan store ownership.");
  }

  if (store.owner_id !== userId) {
    throw new YouCanPersistenceError(
      "This YouCan store is already connected to another account.",
    );
  }
}

export interface YouCanStoreCredentials {
  storeId: string;
  ownerId: string;
  storeSlug: string;
  youcanStoreId: string | null;
  accessToken: string;
}

export async function persistYouCanConnectionForUser(input: {
  userId: string;
  userEmail: string;
  storeSlug: string;
  youcanStoreId?: string | null;
  storeName?: string;
  accessToken: string;
  scope?: string;
}): Promise<{ storeId: string }> {
  const db = createDatabaseClient();
  const env = getYouCanOAuthEnv();
  const encryptedAccessToken = encryptSecret(
    input.accessToken,
    env.YOUCAN_SESSION_SECRET,
  );
  const connectedAt = new Date().toISOString();

  await assertYouCanStoreAvailableForUser(db, input.storeSlug, input.userId);

  const { error: profileError } = await db.from("profiles").upsert(
    {
      id: input.userId,
      email: input.userEmail,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new YouCanPersistenceError("Unable to persist user profile.");
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .upsert(
      {
        owner_id: input.userId,
        name: input.storeName ?? buildYouCanStoreName(input.storeSlug),
        platform: "youcan",
        external_store_id: input.storeSlug,
        status: "active",
      },
      { onConflict: "owner_id,platform,external_store_id" },
    )
    .select("id")
    .single();

  if (storeError || !store) {
    throw new YouCanPersistenceError("Unable to persist store.");
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .upsert(
      {
        store_id: store.id,
        connection_type: "store",
        provider: "youcan",
        status: "active",
      },
      { onConflict: "store_id,connection_type,provider" },
    )
    .select("id")
    .single();

  if (connectionError || !storeConnection) {
    throw new YouCanPersistenceError("Unable to persist store connection.");
  }

  const { error: youCanConnectionError } = await db
    .from("youcan_connections")
    .upsert(
      {
        store_connection_id: storeConnection.id,
        store_slug: input.storeSlug,
        youcan_store_id: input.youcanStoreId ?? null,
        scope: input.scope ?? null,
        connected_at: connectedAt,
        error_message: null,
      },
      { onConflict: "store_connection_id" },
    );

  if (youCanConnectionError) {
    throw new YouCanPersistenceError("Unable to persist YouCan connection.");
  }

  const { error: secretError } = await db
    .from("youcan_connection_secrets")
    .upsert(
      {
        store_connection_id: storeConnection.id,
        encrypted_access_token: encryptedAccessToken,
      },
      { onConflict: "store_connection_id" },
    );

  if (secretError) {
    throw new YouCanPersistenceError("Unable to persist YouCan credentials.");
  }

  return { storeId: store.id };
}

export async function getYouCanStoreCredentialsForStore(
  storeId: string,
): Promise<YouCanStoreCredentials | null> {
  const db = createDatabaseClient();
  const env = getYouCanOAuthEnv();

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("id, owner_id, external_store_id")
    .eq("id", storeId)
    .eq("platform", "youcan")
    .maybeSingle();

  if (storeError || !store?.external_store_id || !store.owner_id) {
    return null;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, status")
    .eq("store_id", store.id)
    .eq("connection_type", "store")
    .eq("provider", "youcan")
    .eq("status", "active")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: youCanConnection, error: youCanError } = await db
    .from("youcan_connections")
    .select("store_slug, youcan_store_id")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (youCanError || !youCanConnection) {
    return null;
  }

  const { data: secretRow, error: secretError } = await db
    .from("youcan_connection_secrets")
    .select("encrypted_access_token")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (secretError || !secretRow?.encrypted_access_token) {
    return null;
  }

  const accessToken = decryptSecret(
    secretRow.encrypted_access_token,
    env.YOUCAN_SESSION_SECRET,
  );

  if (!accessToken) {
    return null;
  }

  return {
    storeId: store.id,
    ownerId: store.owner_id,
    storeSlug: youCanConnection.store_slug,
    youcanStoreId: youCanConnection.youcan_store_id,
    accessToken,
  };
}

export async function getYouCanConnectionStateForUser(
  userId: string,
): Promise<YouCanConnectionPublicState | null> {
  const db = createDatabaseClient();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId)
    .eq("platform", "youcan");

  if (storesError || !stores?.length) {
    return null;
  }

  const storeIds = stores.map((store) => store.id);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, status")
    .in("store_id", storeIds)
    .eq("connection_type", "store")
    .eq("provider", "youcan")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: youCanConnection, error: youCanError } = await db
    .from("youcan_connections")
    .select("store_slug, scope, connected_at, error_message")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (youCanError || !youCanConnection) {
    return null;
  }

  return {
    provider: "youcan",
    storeSlug: youCanConnection.store_slug,
    status: toConnectionStatus(storeConnection.status),
    errorMessage: youCanConnection.error_message ?? undefined,
  };
}

export async function getYouCanStoreIdForUser(
  userId: string,
): Promise<string | null> {
  const db = createDatabaseClient();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId)
    .eq("platform", "youcan")
    .limit(1);

  if (storesError || !stores?.length) {
    return null;
  }

  return stores[0].id;
}

async function removeYouCanConnectionRecordsForStore(
  storeId: string,
): Promise<void> {
  const db = createDatabaseClient();

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id")
    .eq("store_id", storeId)
    .eq("connection_type", "store")
    .eq("provider", "youcan")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return;
  }

  await db
    .from("youcan_connection_secrets")
    .delete()
    .eq("store_connection_id", storeConnection.id);

  await db
    .from("store_connections")
    .update({ status: "inactive" })
    .eq("id", storeConnection.id);

  await db
    .from("youcan_connections")
    .update({
      connected_at: null,
      error_message: null,
    })
    .eq("store_connection_id", storeConnection.id);
}

export async function disconnectYouCanStoreForUser(
  userId: string,
  storeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const db = createDatabaseClient();

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("id, owner_id")
    .eq("id", storeId)
    .eq("platform", "youcan")
    .maybeSingle();

  if (storeError || !store) {
    return;
  }

  if (store.owner_id !== userId) {
    throw new YouCanPersistenceError("YouCan store access forbidden.");
  }

  const credentials = await getYouCanStoreCredentialsForStore(storeId);
  if (credentials) {
    await unregisterYouCanOrderCreatedWebhook(
      {
        accessToken: credentials.accessToken,
      },
      fetchImpl,
    );
  }

  await removeYouCanConnectionRecordsForStore(storeId);
}

export async function disconnectYouCanConnectionForUser(
  userId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const storeId = await getYouCanStoreIdForUser(userId);
  if (!storeId) {
    return;
  }

  await disconnectYouCanStoreForUser(userId, storeId, fetchImpl);
}
