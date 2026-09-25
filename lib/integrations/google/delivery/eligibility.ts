import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDatabaseClient } from "@/lib/database/client";
import { decryptSecret } from "@/lib/integrations/shopify/oauth";
import { getGoogleEnv } from "../env";
import type { GoogleVerificationStatus } from "../types";

export interface GoogleDeliveryConnection {
  conversionId: string;
  conversionLabel: string | null;
  accessToken: string;
}

export function isGoogleDeliveryEligible(
  status: GoogleVerificationStatus | null | undefined,
): boolean {
  return status === "verified";
}

function ineligibleReason(status: GoogleVerificationStatus | null | undefined): string {
  switch (status) {
    case "unverified":
      return "Google credentials have not been verified.";
    case "credentials_valid":
      return "Google credentials are valid but not fully verified for delivery.";
    case "identifier_not_verified":
      return "Google conversion id could not be verified for delivery.";
    case "failed":
      return "Google credential verification failed.";
    default:
      return "Google connection is not configured.";
  }
}

export async function loadEligibleGoogleConnectionForStore(input: {
  storeId: string;
  db?: SupabaseClient;
}): Promise<
  | { eligible: true; connection: GoogleDeliveryConnection }
  | { eligible: false; message: string }
> {
  const db = input.db ?? createDatabaseClient();
  const env = getGoogleEnv();

  const { data: storeConnection, error: connectionError } = await db
    .from("store_connections")
    .select("id")
    .eq("store_id", input.storeId)
    .eq("connection_type", "marketing")
    .eq("provider", "google")
    .eq("status", "active")
    .maybeSingle();

  if (connectionError || !storeConnection) {
    return { eligible: false, message: "Google connection is not configured." };
  }

  const { data: googleConnection, error: googleError } = await db
    .from("google_connections")
    .select("conversion_id, conversion_label, verification_status")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (googleError || !googleConnection?.conversion_id) {
    return { eligible: false, message: "Google conversion id is not configured." };
  }

  const verificationStatus =
    googleConnection.verification_status as GoogleVerificationStatus | null;

  if (!isGoogleDeliveryEligible(verificationStatus)) {
    return { eligible: false, message: ineligibleReason(verificationStatus) };
  }

  const { data: secretRow, error: secretError } = await db
    .from("google_connection_secrets")
    .select("encrypted_access_token")
    .eq("store_connection_id", storeConnection.id)
    .maybeSingle();

  if (secretError || !secretRow?.encrypted_access_token) {
    return { eligible: false, message: "Google access token is not configured." };
  }

  const accessToken = decryptSecret(
    secretRow.encrypted_access_token,
    env.GOOGLE_SESSION_SECRET,
  );

  if (!accessToken) {
    return { eligible: false, message: "Google access token is unavailable." };
  }

  return {
    eligible: true,
    connection: {
      conversionId: googleConnection.conversion_id,
      conversionLabel: googleConnection.conversion_label,
      accessToken,
    },
  };
}
