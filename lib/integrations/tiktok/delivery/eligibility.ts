import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDatabaseClient } from "@/lib/database/client";
import { decryptSecret } from "@/lib/integrations/shopify/oauth";
import { getTikTokEnv } from "../env";
import type { TikTokVerificationStatus } from "../types";

export interface TikTokDeliveryConnection {
  pixelCode: string;
  accessToken: string;
}

export function isTikTokDeliveryEligible(
  status: TikTokVerificationStatus | null | undefined,
): boolean {
  return status === "verified";
}

function ineligibleReason(status: TikTokVerificationStatus | null | undefined): string {
  switch (status) {
    case "unverified":
      return "TikTok credentials have not been verified.";
    case "credentials_valid":
      return "TikTok credentials are valid but not fully verified for delivery.";
    case "identifier_not_verified":
      return "TikTok pixel could not be verified for delivery.";
    case "failed":
      return "TikTok credential verification failed.";
    default:
      return "TikTok connection is not configured.";
  }
}

export async function loadEligibleTikTokConnectionForStore(input: {
  storeId: string;
  db?: SupabaseClient;
}): Promise<
  | { eligible: true; connection: TikTokDeliveryConnection }
  | { eligible: false; message: string }
> {
  const db = input.db ?? createDatabaseClient();
  const env = getTikTokEnv();

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id")
    .eq("store_id", input.storeId)
    .eq("connection_type", "marketing")
    .eq("provider", "tiktok")
    .eq("status", "active")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return { eligible: false, message: "TikTok connection is not configured." };
  }

  const { data: tiktokConnection, error: tiktokError } = await db
    .from("tiktok_connections")
    .select("pixel_code, verification_status")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (tiktokError || !tiktokConnection?.pixel_code) {
    return { eligible: false, message: "TikTok pixel is not configured." };
  }

  const verificationStatus =
    tiktokConnection.verification_status as TikTokVerificationStatus | null;

  if (!isTikTokDeliveryEligible(verificationStatus)) {
    return { eligible: false, message: ineligibleReason(verificationStatus) };
  }

  const { data: secretRow, error: secretError } = await db
    .from("tiktok_connection_secrets")
    .select("encrypted_access_token")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (secretError || !secretRow?.encrypted_access_token) {
    return { eligible: false, message: "TikTok access token is not configured." };
  }

  const accessToken = decryptSecret(
    secretRow.encrypted_access_token,
    env.TIKTOK_SESSION_SECRET,
  );

  if (!accessToken) {
    return { eligible: false, message: "TikTok access token is unavailable." };
  }

  return {
    eligible: true,
    connection: {
      pixelCode: tiktokConnection.pixel_code,
      accessToken,
    },
  };
}
