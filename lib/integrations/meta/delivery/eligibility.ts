import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDatabaseClient } from "@/lib/database/client";
import { decryptSecret } from "@/lib/integrations/shopify/oauth";
import { getMetaEnv } from "../env";
import type { MetaVerificationStatus } from "../verification/types";

export interface MetaDeliveryConnection {
  pixelId: string;
  accessToken: string;
}

const DELIVERY_ELIGIBLE_STATUSES = new Set<MetaVerificationStatus>(["verified"]);

function ineligibleReason(status: MetaVerificationStatus | null | undefined): string {
  switch (status) {
    case "unverified":
      return "Meta credentials have not been verified.";
    case "credentials_valid":
      return "Meta credentials are valid but not fully verified for delivery.";
    case "identifier_not_verified":
      return "Meta Pixel/Dataset could not be verified for delivery.";
    case "failed":
      return "Meta credential verification failed.";
    default:
      return "Meta connection is not configured.";
  }
}

export async function loadEligibleMetaConnectionForStore(input: {
  userId: string;
  storeId: string;
  db?: SupabaseClient;
}): Promise<
  | { eligible: true; connection: MetaDeliveryConnection }
  | { eligible: false; message: string }
> {
  const db = input.db ?? createDatabaseClient();
  const env = getMetaEnv();

  const { data: store, error: storeError } = await db
    .from("stores")
    .select("id")
    .eq("id", input.storeId)
    .eq("owner_id", input.userId)
    .maybeSingle();

  if (storeError || !store) {
    return { eligible: false, message: "Store not found." };
  }

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id")
    .eq("store_id", input.storeId)
    .eq("connection_type", "marketing")
    .eq("provider", "meta")
    .eq("status", "active")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return { eligible: false, message: "Meta connection is not configured." };
  }

  const { data: metaConnection, error: metaError } = await db
    .from("meta_connections")
    .select("pixel_id, verification_status")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (metaError || !metaConnection?.pixel_id) {
    return { eligible: false, message: "Meta Pixel/Dataset is not configured." };
  }

  const verificationStatus =
    metaConnection.verification_status as MetaVerificationStatus | null;

  if (!verificationStatus || !DELIVERY_ELIGIBLE_STATUSES.has(verificationStatus)) {
    return {
      eligible: false,
      message: ineligibleReason(verificationStatus),
    };
  }

  const { data: secretRow, error: secretError } = await db
    .from("meta_connection_secrets")
    .select("encrypted_access_token")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (secretError || !secretRow?.encrypted_access_token) {
    return { eligible: false, message: "Meta access token is not configured." };
  }

  const accessToken = decryptSecret(
    secretRow.encrypted_access_token,
    env.META_SESSION_SECRET,
  );

  if (!accessToken) {
    return { eligible: false, message: "Meta access token is unavailable." };
  }

  return {
    eligible: true,
    connection: {
      pixelId: metaConnection.pixel_id,
      accessToken,
    },
  };
}
