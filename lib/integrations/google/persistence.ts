import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { toConnectionStatus } from "@/lib/database/connection-status";
import { createDatabaseClient } from "@/lib/database/client";
import { decryptSecret, encryptSecret } from "@/lib/integrations/shopify/oauth";
import { getGoogleEnv } from "./env";
import type {
  GoogleConnectionPublicState,
  GoogleCredentialVerificationResult,
  GoogleVerificationStatus,
} from "./types";
import { maskConversionId } from "./validation";

export class GooglePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GooglePersistenceError";
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
    throw new GooglePersistenceError("Connect a store before configuring Google Ads.");
  }

  return stores[0]!.id;
}

export async function assertConversionAvailableForUser(
  db: SupabaseClient,
  conversionId: string,
  ownerId: string,
): Promise<void> {
  const { data: existing, error } = await db
    .from("google_connections")
    .select("store_connection_id, conversion_id")
    .eq("conversion_id", conversionId)
    .maybeSingle();

  if (error) {
    throw new GooglePersistenceError("Unable to verify Google conversion ownership.");
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
    throw new GooglePersistenceError("Unable to verify Google conversion ownership.");
  }

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("owner_id")
    .eq("id", storeConnection.store_id)
    .maybeSingle();

  if (storeError || !store) {
    throw new GooglePersistenceError("Unable to verify Google conversion ownership.");
  }

  if (store.owner_id !== ownerId) {
    throw new GooglePersistenceError(
      "This Google conversion is already connected to another account.",
    );
  }
}

export async function persistGoogleConnection(input: {
  owner_id: string;
  measurement_id?: string;
  api_secret?: string;
  conversion_id?: string;
  conversion_label?: string | null;
  access_token?: string;
}): Promise<void> {
  const measurementId = (input.measurement_id ?? input.conversion_id ?? "").trim();
  const apiSecret = (input.api_secret ?? input.access_token ?? "").trim();
  if (!measurementId || !apiSecret) {
    throw new GooglePersistenceError("Google credentials are incomplete.");
  }

  const db = createDatabaseClient();
  const env = getGoogleEnv();
  const encryptedAccessToken = encryptSecret(apiSecret, env.GOOGLE_SESSION_SECRET);
  const connectedAt = new Date().toISOString();

  await assertConversionAvailableForUser(db, measurementId, input.owner_id);
  const storeId = await resolveOwnedStoreId(db, input.owner_id);

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .upsert(
      {
        store_id: storeId,
        connection_type: "marketing",
        provider: "google",
        status: "active",
      },
      { onConflict: "store_id,connection_type,provider" },
    )
    .select("id")
    .single();

  if (connectionError || !storeConnection) {
    throw new GooglePersistenceError("Unable to persist Google store connection.");
  }

  const { error: connectionRowError } = await db.from("google_connections").upsert(
    {
      store_connection_id: storeConnection.id,
      conversion_id: measurementId,
      conversion_label: input.conversion_label ?? null,
      connected_at: connectedAt,
      verification_status: "unverified",
      verified_at: null,
      error_message: null,
    },
    { onConflict: "store_connection_id" },
  );

  if (connectionRowError) {
    throw new GooglePersistenceError("Unable to persist Google connection.");
  }

  const { error: secretError } = await db.from("google_connection_secrets").upsert(
    {
      store_connection_id: storeConnection.id,
      encrypted_access_token: encryptedAccessToken,
    },
    { onConflict: "store_connection_id" },
  );

  if (secretError) {
    throw new GooglePersistenceError("Unable to persist Google credentials.");
  }
}

export async function getGoogleConnectionStateForUser(
  ownerId: string,
): Promise<GoogleConnectionPublicState | null> {
  const db = createDatabaseClient();
  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", ownerId);

  if (storesError || !stores?.length) {
    return null;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, status")
    .in(
      "store_id",
      stores.map((store) => store.id),
    )
    .eq("connection_type", "marketing")
    .eq("provider", "google")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: googleConnection, error: googleError } = await db
    .from("google_connections")
    .select("conversion_id, conversion_label, verification_status, verified_at, error_message")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (googleError || !googleConnection) {
    return null;
  }

  const status = toConnectionStatus(storeConnection.status);

  return {
    provider: "google",
    status,
    measurementId:
      status === "connected" ? maskConversionId(googleConnection.conversion_id) : undefined,
    conversionId:
      status === "connected" ? maskConversionId(googleConnection.conversion_id) : undefined,
    conversionLabel: googleConnection.conversion_label ?? undefined,
    verificationStatus: googleConnection.verification_status as GoogleVerificationStatus,
    verifiedAt: googleConnection.verified_at ?? undefined,
    errorMessage: googleConnection.error_message ?? undefined,
  };
}

export interface GoogleVerificationContext {
  storeConnectionId: string;
  storeId: string;
  conversionId: string;
  conversionLabel: string | null;
  accessToken: string;
}

export async function loadGoogleConnectionForVerification(
  ownerId: string,
): Promise<GoogleVerificationContext | null> {
  const db = createDatabaseClient();
  const env = getGoogleEnv();
  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", ownerId);

  if (storesError || !stores?.length) {
    return null;
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id, store_id")
    .in(
      "store_id",
      stores.map((store) => store.id),
    )
    .eq("connection_type", "marketing")
    .eq("provider", "google")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return null;
  }

  const { data: googleConnection, error: googleError } = await db
    .from("google_connections")
    .select("conversion_id, conversion_label")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (googleError || !googleConnection?.conversion_id) {
    return null;
  }

  const { data: secretRow, error: secretError } = await db
    .from("google_connection_secrets")
    .select("encrypted_access_token")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (secretError || !secretRow?.encrypted_access_token) {
    return null;
  }

  const accessToken = decryptSecret(
    secretRow.encrypted_access_token,
    env.GOOGLE_SESSION_SECRET,
  );

  if (!accessToken) {
    return null;
  }

  return {
    storeConnectionId: storeConnection.id,
    storeId: storeConnection.store_id,
    conversionId: googleConnection.conversion_id,
    conversionLabel: googleConnection.conversion_label,
    accessToken,
  };
}

export async function persistGoogleVerificationResult(input: {
  storeConnectionId: string;
  result: GoogleCredentialVerificationResult;
}): Promise<void> {
  const db = createDatabaseClient();
  const verifiedAt =
    input.result.status === "verified" ||
    input.result.status === "credentials_valid" ||
    input.result.status === "identifier_not_verified"
      ? new Date().toISOString()
      : null;

  const { error } = await db
    .from("google_connections")
    .update({
      verification_status: input.result.status,
      verified_at: verifiedAt,
      error_message: input.result.message ?? null,
    })
    .eq("store_connection_id", input.storeConnectionId);

  if (error) {
    throw new GooglePersistenceError("Unable to persist Google verification state.");
  }
}
