import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { toConnectionStatus } from "@/lib/database/connection-status";
import { createDatabaseClient } from "@/lib/database/client";
import { decryptSecret, encryptSecret } from "@/lib/integrations/shopify/oauth";
import { getTikTokEnv } from "./env";
import type {
  TikTokConnectionPublicState,
  TikTokCredentialVerificationResult,
  TikTokVerificationStatus,
} from "./types";
import { maskPixelCode } from "./validation";

export class TikTokPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TikTokPersistenceError";
  }
}

async function resolveOwnedStoreId(db: SupabaseClient, ownerId: string): Promise<string> {
  const { data: stores, error } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !stores?.length) {
    throw new TikTokPersistenceError("Connect a store before configuring TikTok.");
  }

  return stores[0]!.id;
}

export async function assertPixelAvailableForUser(
  db: SupabaseClient,
  pixelCode: string,
  ownerId: string,
): Promise<void> {
  const { data: existing, error } = await db
    .from("tiktok_connections")
    .select("store_connection_id, pixel_code")
    .eq("pixel_code", pixelCode)
    .maybeSingle();

  if (error) {
    throw new TikTokPersistenceError("Unable to verify TikTok pixel ownership.");
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
    throw new TikTokPersistenceError("Unable to verify TikTok pixel ownership.");
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("owner_id")
    .eq("id", storeConnection.store_id)
    .maybeSingle();

  if (storeError || !store) {
    throw new TikTokPersistenceError("Unable to verify TikTok pixel ownership.");
  }

  if (store.owner_id !== ownerId) {
    throw new TikTokPersistenceError(
      "This TikTok pixel is already connected to another account.",
    );
  }
}

export async function persistTikTokConnection(input: {
  owner_id: string;
  pixel_code: string;
  access_token: string;
}): Promise<void> {
  const db = createDatabaseClient();
  const env = getTikTokEnv();
  const encryptedAccessToken = encryptSecret(input.access_token, env.TIKTOK_SESSION_SECRET);
  const connectedAt = new Date().toISOString();

  await assertPixelAvailableForUser(db, input.pixel_code, input.owner_id);
  const storeId = await resolveOwnedStoreId(db, input.owner_id);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .upsert(
      {
        store_id: storeId,
        connection_type: "marketing",
        provider: "tiktok",
        status: "active",
      },
      { onConflict: "store_id,connection_type,provider" },
    )
    .select("id")
    .single();

  if (connectionError || !storeConnection) {
    throw new TikTokPersistenceError("Unable to persist TikTok store connection.");
  }

  const { error: connectionRowError } = await db.from("tiktok_connections").upsert(
    {
      store_connection_id: storeConnection.id,
      pixel_code: input.pixel_code,
      connected_at: connectedAt,
      verification_status: "unverified",
      verified_at: null,
      error_message: null,
    },
    { onConflict: "store_connection_id" },
  );

  if (connectionRowError) {
    throw new TikTokPersistenceError("Unable to persist TikTok connection.");
  }

  const { error: secretError } = await db.from("tiktok_connection_secrets").upsert(
    {
      store_connection_id: storeConnection.id,
      encrypted_access_token: encryptedAccessToken,
    },
    { onConflict: "store_connection_id" },
  );

  if (secretError) {
    throw new TikTokPersistenceError("Unable to persist TikTok credentials.");
  }
}

export async function getTikTokConnectionStateForUser(
  ownerId: string,
): Promise<TikTokConnectionPublicState | null> {
  const db = createDatabaseClient();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", ownerId);

  if (storesError || !stores?.length) {
    return null;
  }

  const storeIds = stores.map((store) => store.id);
  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, status")
    .in("store_id", storeIds)
    .eq("connection_type", "marketing")
    .eq("provider", "tiktok")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: tiktokConnection, error: tiktokError } = await db
    .from("tiktok_connections")
    .select("pixel_code, verification_status, verified_at, error_message")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (tiktokError || !tiktokConnection) {
    return null;
  }

  const status = toConnectionStatus(storeConnection.status);

  return {
    provider: "tiktok",
    status,
    pixelCode: status === "connected" ? maskPixelCode(tiktokConnection.pixel_code) : undefined,
    verificationStatus: tiktokConnection.verification_status as TikTokVerificationStatus,
    verifiedAt: tiktokConnection.verified_at ?? undefined,
    errorMessage: tiktokConnection.error_message ?? undefined,
  };
}

export interface TikTokVerificationContext {
  storeConnectionId: string;
  storeId: string;
  pixelCode: string;
  accessToken: string;
}

export async function loadTikTokConnectionForVerification(
  ownerId: string,
): Promise<TikTokVerificationContext | null> {
  const db = createDatabaseClient();
  const env = getTikTokEnv();

  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", ownerId);

  if (storesError || !stores?.length) {
    return null;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, store_id, status")
    .in(
      "store_id",
      stores.map((store) => store.id),
    )
    .eq("connection_type", "marketing")
    .eq("provider", "tiktok")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: tiktokConnection, error: tiktokError } = await db
    .from("tiktok_connections")
    .select("pixel_code")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (tiktokError || !tiktokConnection?.pixel_code) {
    return null;
  }

  const { data: secretRow, error: secretError } = await db
    .from("tiktok_connection_secrets")
    .select("encrypted_access_token")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (secretError || !secretRow?.encrypted_access_token) {
    return null;
  }

  const accessToken = decryptSecret(
    secretRow.encrypted_access_token,
    env.TIKTOK_SESSION_SECRET,
  );

  if (!accessToken) {
    return null;
  }

  return {
    storeConnectionId: storeConnection.id,
    storeId: storeConnection.store_id,
    pixelCode: tiktokConnection.pixel_code,
    accessToken,
  };
}

export async function persistTikTokVerificationResult(input: {
  storeConnectionId: string;
  result: TikTokCredentialVerificationResult;
}): Promise<void> {
  const db = createDatabaseClient();
  const verifiedAt =
    input.result.status === "verified" ||
    input.result.status === "credentials_valid" ||
    input.result.status === "identifier_not_verified"
      ? new Date().toISOString()
      : null;

  const { error } = await db
    .from("tiktok_connections")
    .update({
      verification_status: input.result.status,
      verified_at: verifiedAt,
      error_message: input.result.message ?? null,
    })
    .eq("store_connection_id", input.storeConnectionId);

  if (error) {
    throw new TikTokPersistenceError("Unable to persist TikTok verification state.");
  }
}
