import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createDatabaseClient } from "@/lib/database/client";
import { disconnectGoogleConnection } from "../disconnect";
import { getGoogleConnectionStateForUser } from "../persistence";
import type { GoogleConnectionPublicState, GoogleDeliveryStats } from "../types";

export async function getGoogleConnectionPublicState(): Promise<GoogleConnectionPublicState> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { provider: "google", status: "not_connected" };
  }

  const persisted = await getGoogleConnectionStateForUser(user.id);
  return persisted ?? { provider: "google", status: "not_connected" };
}

export async function clearGoogleConnection(): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  await disconnectGoogleConnection(user.id);
}

export async function getGoogleDeliveryStatsForUser(
  ownerId: string,
): Promise<GoogleDeliveryStats | null> {
  const db = createDatabaseClient();
  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", ownerId);

  if (storesError || !stores?.length) {
    return { pending: 0, sent: 0, failed: 0 };
  }

  const { data, error } = await db
    .from("google_conversion_deliveries")
    .select("status")
    .in(
      "store_id",
      stores.map((store) => store.id),
    );

  if (error || !data) {
    return null;
  }

  const stats: GoogleDeliveryStats = { pending: 0, sent: 0, failed: 0 };
  for (const row of data) {
    if (row.status === "sent") stats.sent += 1;
    else if (row.status === "failed") stats.failed += 1;
    else stats.pending += 1;
  }

  return stats;
}
