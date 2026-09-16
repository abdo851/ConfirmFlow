import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { toConnectionStatus } from "@/lib/database/connection-status";
import { createDatabaseClient } from "@/lib/database/client";
import { encryptSecret, decryptSecret } from "@/lib/integrations/shopify/oauth";
import { getMetaEnv } from "./env";
import { maskPixelId } from "./validation";
import type { MetaConnectionPublicState } from "./types";

export class MetaPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaPersistenceError";
  }
}

async function resolveOwnedStoreId(
  db: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: stores, error } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !stores?.length) {
    throw new MetaPersistenceError(
      "Connect a store before configuring Meta.",
    );
  }

  return stores[0]!.id;
}

export async function assertPixelAvailableForUser(
  db: SupabaseClient,
  pixelId: string,
  userId: string,
): Promise<void> {
  const { data: existingMeta, error: metaError } = await db
    .from("meta_connections")
    .select("store_connection_id, pixel_id")
    .eq("pixel_id", pixelId)
    .maybeSingle();

  if (metaError) {
    throw new MetaPersistenceError("Unable to verify Meta Pixel ownership.");
  }

  if (!existingMeta) {
    return;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("store_id")
    .eq("id", existingMeta.store_connection_id)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    throw new MetaPersistenceError("Unable to verify Meta Pixel ownership.");
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("owner_id")
    .eq("id", storeConnection.store_id)
    .maybeSingle();

  if (storeError || !store) {
    throw new MetaPersistenceError("Unable to verify Meta Pixel ownership.");
  }

  if (store.owner_id !== userId) {
    throw new MetaPersistenceError(
      "This Meta Pixel is already connected to another account.",
    );
  }
}

export async function persistMetaConnectionForUser(input: {
  userId: string;
  pixelId: string;
  accessToken: string;
}): Promise<void> {
  const db = createDatabaseClient();
  const env = getMetaEnv();
  const encryptedAccessToken = encryptSecret(
    input.accessToken,
    env.META_SESSION_SECRET,
  );
  const connectedAt = new Date().toISOString();

  await assertPixelAvailableForUser(db, input.pixelId, input.userId);

  const storeId = await resolveOwnedStoreId(db, input.userId);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .upsert(
      {
        store_id: storeId,
        connection_type: "marketing",
        provider: "meta",
        status: "active",
      },
      { onConflict: "store_id,connection_type,provider" },
    )
    .select("id")
    .single();

  if (connectionError || !storeConnection) {
    throw new MetaPersistenceError("Unable to persist Meta store connection.");
  }

  const { error: metaConnectionError } = await db.from("meta_connections").upsert(
    {
      store_connection_id: storeConnection.id,
      pixel_id: input.pixelId,
      connected_at: connectedAt,
      error_message: null,
    },
    { onConflict: "store_connection_id" },
  );

  if (metaConnectionError) {
    throw new MetaPersistenceError("Unable to persist Meta connection.");
  }

  const { error: secretError } = await db.from("meta_connection_secrets").upsert(
    {
      store_connection_id: storeConnection.id,
      encrypted_access_token: encryptedAccessToken,
    },
    { onConflict: "store_connection_id" },
  );

  if (secretError) {
    throw new MetaPersistenceError("Unable to persist Meta credentials.");
  }
}

export async function getMetaConnectionStateForUser(
  userId: string,
): Promise<MetaConnectionPublicState | null> {
  const db = createDatabaseClient();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId);

  if (storesError || !stores?.length) {
    return null;
  }

  const storeIds = stores.map((store) => store.id);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, status")
    .in("store_id", storeIds)
    .eq("connection_type", "marketing")
    .eq("provider", "meta")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: metaConnection, error: metaError } = await db
    .from("meta_connections")
    .select("pixel_id, connected_at, error_message")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (metaError || !metaConnection) {
    return null;
  }

  const status = toConnectionStatus(storeConnection.status);

  return {
    provider: "meta",
    status,
    pixelId:
      status === "connected" ? maskPixelId(metaConnection.pixel_id) : undefined,
    errorMessage: metaConnection.error_message ?? undefined,
  };
}

export async function getMetaAccessTokenForUser(
  userId: string,
): Promise<string | null> {
  const db = createDatabaseClient();
  const env = getMetaEnv();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId);

  if (storesError || !stores?.length) {
    return null;
  }

  const storeIds = stores.map((store) => store.id);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, status")
    .in("store_id", storeIds)
    .eq("connection_type", "marketing")
    .eq("provider", "meta")
    .eq("status", "active")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: secretRow, error: secretError } = await db
    .from("meta_connection_secrets")
    .select("encrypted_access_token")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (secretError || !secretRow?.encrypted_access_token) {
    return null;
  }

  return decryptSecret(
    secretRow.encrypted_access_token,
    env.META_SESSION_SECRET,
  );
}

export async function disconnectMetaConnectionForUser(
  userId: string,
): Promise<void> {
  const db = createDatabaseClient();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId);

  if (storesError || !stores?.length) {
    return;
  }

  const storeIds = stores.map((store) => store.id);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id")
    .in("store_id", storeIds)
    .eq("connection_type", "marketing")
    .eq("provider", "meta")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return;
  }

  await db
    .from("meta_connection_secrets")
    .delete()
    .eq("store_connection_id", storeConnection.id);

  await db
    .from("store_connections")
    .update({ status: "inactive" })
    .eq("id", storeConnection.id);

  await db
    .from("meta_connections")
    .update({
      connected_at: null,
      error_message: null,
    })
    .eq("store_connection_id", storeConnection.id);
}
