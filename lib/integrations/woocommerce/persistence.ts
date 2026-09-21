import type { SupabaseClient } from "@supabase/supabase-js";
import { toConnectionStatus } from "@/lib/database/connection-status";
import { createDatabaseClient } from "@/lib/database/client";
import { logger } from "@/lib/logging/logger";
import { getWooCommerceEnv } from "./env";
import { encryptSecret } from "./oauth/crypto";
import type { WooCommerceConnectionPublicState } from "./types";

export class WooCommercePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WooCommercePersistenceError";
  }
}

async function assertStoreAvailableForUser(
  db: SupabaseClient,
  storeUrl: string,
  userId: string,
): Promise<void> {
  const { data: existing, error } = await db
    .from("woocommerce_connections")
    .select("store_connection_id")
    .eq("store_url", storeUrl)
    .maybeSingle();

  if (error) {
    throw new WooCommercePersistenceError("Unable to verify WooCommerce store ownership.");
  }

  if (!existing) {
    return;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("store_id")
    .eq("id", existing.store_connection_id)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    throw new WooCommercePersistenceError("Unable to verify WooCommerce store ownership.");
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("owner_id")
    .eq("id", storeConnection.store_id)
    .maybeSingle();

  if (storeError || !store) {
    throw new WooCommercePersistenceError("Unable to verify WooCommerce store ownership.");
  }

  if (store.owner_id !== userId) {
    throw new WooCommercePersistenceError(
      "This WooCommerce store is already connected to another account.",
    );
  }
}

export async function persistWooCommerceConnectionForUser(
  input: {
    userId: string;
    userEmail: string;
    storeUrl: string;
    consumerKey: string;
    consumerSecret: string;
    scope?: string | null;
  },
  db: SupabaseClient = createDatabaseClient(),
): Promise<{ storeId: string }> {
  const env = getWooCommerceEnv();
  const encryptedConsumerKey = encryptSecret(
    input.consumerKey,
    env.WOOCOMMERCE_SESSION_SECRET,
  );
  const encryptedConsumerSecret = encryptSecret(
    input.consumerSecret,
    env.WOOCOMMERCE_SESSION_SECRET,
  );
  const connectedAt = new Date().toISOString();

  await assertStoreAvailableForUser(db, input.storeUrl, input.userId);

  if (input.userEmail) {
    const { error: profileError } = await db.from("profiles").upsert(
      {
        id: input.userId,
        email: input.userEmail,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw new WooCommercePersistenceError("Unable to persist user profile.");
    }
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .upsert(
      {
        owner_id: input.userId,
        name: input.storeUrl,
        platform: "woocommerce",
        external_store_id: input.storeUrl,
        status: "active",
      },
      { onConflict: "owner_id,platform,external_store_id" },
    )
    .select("id")
    .single();

  if (storeError || !store) {
    throw new WooCommercePersistenceError("Unable to persist store.");
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .upsert(
      {
        store_id: store.id,
        connection_type: "store",
        provider: "woocommerce",
        status: "active",
      },
      { onConflict: "store_id,connection_type,provider" },
    )
    .select("id")
    .single();

  if (connectionError || !storeConnection) {
    throw new WooCommercePersistenceError("Unable to persist store connection.");
  }

  const { error: wooConnectionError } = await db.from("woocommerce_connections").upsert(
    {
      store_connection_id: storeConnection.id,
      store_url: input.storeUrl,
      scope: input.scope ?? null,
      connected_at: connectedAt,
      error_message: null,
    },
    { onConflict: "store_connection_id" },
  );

  if (wooConnectionError) {
    throw new WooCommercePersistenceError("Unable to persist WooCommerce connection.");
  }

  const { error: secretError } = await db.from("woocommerce_connection_secrets").upsert(
    {
      store_connection_id: storeConnection.id,
      encrypted_consumer_key: encryptedConsumerKey,
      encrypted_consumer_secret: encryptedConsumerSecret,
    },
    { onConflict: "store_connection_id" },
  );

  if (secretError) {
    throw new WooCommercePersistenceError("Unable to persist WooCommerce credentials.");
  }

  return { storeId: store.id };
}

export async function getWooCommerceConnectionStateForUser(
  userId: string,
  db: SupabaseClient = createDatabaseClient(),
): Promise<WooCommerceConnectionPublicState> {
  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId)
    .eq("platform", "woocommerce");

  if (storesError || !stores?.length) {
    logger.info("woocommerce_status_not_connected", {
      reason: storesError ? "stores_query_failed" : "no_store",
      detail: storesError?.message,
    });
    return { connected: false };
  }

  const storeIds = stores.map((store) => store.id);
  const { data: connections, error: connectionError } = await db
    .from("store_connections")
    .select("id, status, updated_at")
    .in("store_id", storeIds)
    .eq("connection_type", "store")
    .eq("provider", "woocommerce");

  const storeConnection = [...(connections ?? [])].sort((left, right) =>
    String(right.updated_at ?? "").localeCompare(String(left.updated_at ?? "")),
  )[0];

  if (connectionError || !storeConnection) {
    logger.info("woocommerce_status_not_connected", {
      reason: connectionError ? "connection_query_failed" : "no_connection",
      detail: connectionError?.message,
    });
    return { connected: false };
  }

  const { data: wooConnections, error: wooError } = await db
    .from("woocommerce_connections")
    .select("store_url, error_message, connected_at")
    .eq("store_connection_id", storeConnection.id);

  const wooConnection = wooConnections?.[0];

  if (wooError || !wooConnection) {
    logger.info("woocommerce_status_not_connected", {
      reason: wooError ? "woocommerce_query_failed" : "no_woocommerce_row",
      detail: wooError?.message,
    });
    return { connected: false };
  }

  const status = toConnectionStatus(storeConnection.status);
  return {
    connected: status === "connected" && Boolean(wooConnection.connected_at),
    store_url: wooConnection.store_url,
    status,
    error_message: wooConnection.error_message ?? undefined,
  };
}

export async function disconnectWooCommerceConnectionForUser(
  userId: string,
): Promise<void> {
  const db = createDatabaseClient();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId)
    .eq("platform", "woocommerce");

  if (storesError || !stores?.length) {
    return;
  }

  const storeIds = stores.map((store) => store.id);
  const { data: connections, error: connectionError } = await db
    .from("store_connections")
    .select("id")
    .in("store_id", storeIds)
    .eq("connection_type", "store")
    .eq("provider", "woocommerce");

  if (connectionError || !connections?.length) {
    return;
  }

  const connectionIds = connections.map((connection) => connection.id);

  await db
    .from("woocommerce_connection_secrets")
    .delete()
    .in("store_connection_id", connectionIds);

  await db
    .from("woocommerce_connections")
    .delete()
    .in("store_connection_id", connectionIds);

  await db.from("store_connections").delete().in("id", connectionIds);
}
