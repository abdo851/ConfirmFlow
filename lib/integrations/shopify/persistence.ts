import type { SupabaseClient } from "@supabase/supabase-js";
import { toConnectionStatus } from "@/lib/database/connection-status";
import { createDatabaseClient } from "@/lib/database/client";
import { getShopifyOAuthEnv } from "@/lib/integrations/shopify/env";
import { encryptSecret, decryptSecret } from "@/lib/integrations/shopify/oauth";
import type { ShopifyConnectionPublicState } from "@/lib/integrations/shopify/session/types";

export class ShopifyPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyPersistenceError";
  }
}

export function buildShopifyStoreName(shopDomain: string): string {
  return shopDomain.replace(".myshopify.com", "");
}

export async function assertShopAvailableForUser(
  db: SupabaseClient,
  shopDomain: string,
  userId: string,
): Promise<void> {
  const { data: existingShopify, error: shopifyError } = await db
    .from("shopify_connections")
    .select("store_connection_id")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (shopifyError) {
    throw new ShopifyPersistenceError("Unable to verify Shopify store ownership.");
  }

  if (!existingShopify) {
    return;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("store_id")
    .eq("id", existingShopify.store_connection_id)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    throw new ShopifyPersistenceError("Unable to verify Shopify store ownership.");
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("owner_id")
    .eq("id", storeConnection.store_id)
    .maybeSingle();

  if (storeError || !store) {
    throw new ShopifyPersistenceError("Unable to verify Shopify store ownership.");
  }

  if (store.owner_id !== userId) {
    throw new ShopifyPersistenceError(
      "This Shopify store is already connected to another account.",
    );
  }
}

export async function persistShopifyConnectionForUser(input: {
  userId: string;
  userEmail: string;
  shop: string;
  accessToken: string;
  scope?: string;
}): Promise<void> {
  const db = createDatabaseClient();
  const env = getShopifyOAuthEnv();
  const encryptedAccessToken = encryptSecret(
    input.accessToken,
    env.SHOPIFY_SESSION_SECRET,
  );
  const connectedAt = new Date().toISOString();

  await assertShopAvailableForUser(db, input.shop, input.userId);

  const { error: profileError } = await db.from("profiles").upsert(
    {
      id: input.userId,
      email: input.userEmail,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new ShopifyPersistenceError("Unable to persist user profile.");
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .upsert(
      {
        owner_id: input.userId,
        name: buildShopifyStoreName(input.shop),
        platform: "shopify",
        external_store_id: input.shop,
        status: "active",
      },
      { onConflict: "owner_id,platform,external_store_id" },
    )
    .select("id")
    .single();

  if (storeError || !store) {
    throw new ShopifyPersistenceError("Unable to persist store.");
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .upsert(
      {
        store_id: store.id,
        connection_type: "store",
        provider: "shopify",
        status: "active",
      },
      { onConflict: "store_id,connection_type,provider" },
    )
    .select("id")
    .single();

  if (connectionError || !storeConnection) {
    throw new ShopifyPersistenceError("Unable to persist store connection.");
  }

  const { error: shopifyConnectionError } = await db
    .from("shopify_connections")
    .upsert(
      {
        store_connection_id: storeConnection.id,
        shop_domain: input.shop,
        scope: input.scope ?? null,
        connected_at: connectedAt,
        error_message: null,
      },
      { onConflict: "store_connection_id" },
    );

  if (shopifyConnectionError) {
    throw new ShopifyPersistenceError("Unable to persist Shopify connection.");
  }

  const { error: secretError } = await db
    .from("shopify_connection_secrets")
    .upsert(
      {
        store_connection_id: storeConnection.id,
        encrypted_access_token: encryptedAccessToken,
      },
      { onConflict: "store_connection_id" },
    );

  if (secretError) {
    throw new ShopifyPersistenceError("Unable to persist Shopify credentials.");
  }
}

export async function getShopifyConnectionStateForUser(
  userId: string,
): Promise<ShopifyConnectionPublicState | null> {
  const db = createDatabaseClient();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId)
    .eq("platform", "shopify");

  if (storesError || !stores?.length) {
    return null;
  }

  const storeIds = stores.map((store) => store.id);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, status")
    .in("store_id", storeIds)
    .eq("connection_type", "store")
    .eq("provider", "shopify")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: shopifyConnection, error: shopifyError } = await db
    .from("shopify_connections")
    .select("shop_domain, scope, connected_at, error_message")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (shopifyError || !shopifyConnection) {
    return null;
  }

  return {
    provider: "shopify",
    shop: shopifyConnection.shop_domain,
    status: toConnectionStatus(storeConnection.status),
    errorMessage: shopifyConnection.error_message ?? undefined,
  };
}

export async function getShopifyAccessTokenForUser(
  userId: string,
): Promise<string | null> {
  const db = createDatabaseClient();
  const env = getShopifyOAuthEnv();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId)
    .eq("platform", "shopify");

  if (storesError || !stores?.length) {
    return null;
  }

  const storeIds = stores.map((store) => store.id);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, status")
    .in("store_id", storeIds)
    .eq("connection_type", "store")
    .eq("provider", "shopify")
    .eq("status", "active")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: secretRow, error: secretError } = await db
    .from("shopify_connection_secrets")
    .select("encrypted_access_token")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (secretError || !secretRow?.encrypted_access_token) {
    return null;
  }

  return decryptSecret(secretRow.encrypted_access_token, env.SHOPIFY_SESSION_SECRET);
}

export async function disconnectShopifyConnectionForUser(
  userId: string,
): Promise<void> {
  const db = createDatabaseClient();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", userId)
    .eq("platform", "shopify");

  if (storesError || !stores?.length) {
    return;
  }

  const storeIds = stores.map((store) => store.id);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id")
    .in("store_id", storeIds)
    .eq("connection_type", "store")
    .eq("provider", "shopify")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return;
  }

  await db
    .from("shopify_connection_secrets")
    .delete()
    .eq("store_connection_id", storeConnection.id);

  await db
    .from("store_connections")
    .update({ status: "inactive" })
    .eq("id", storeConnection.id);

  await db
    .from("shopify_connections")
    .update({
      connected_at: null,
      error_message: null,
    })
    .eq("store_connection_id", storeConnection.id);
}
