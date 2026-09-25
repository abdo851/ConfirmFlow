import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createDatabaseClient } from "@/lib/database/client";
import { disconnectTikTokConnection } from "../disconnect";
import { getTikTokConnectionStateForUser } from "../persistence";
import type { TikTokConnectionPublicState, TikTokDeliveryStats } from "../types";

export async function getTikTokConnectionPublicState(): Promise<TikTokConnectionPublicState> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { provider: "tiktok", status: "not_connected" };
  }

  const persisted = await getTikTokConnectionStateForUser(user.id);
  return persisted ?? { provider: "tiktok", status: "not_connected" };
}

export async function clearTikTokConnection(): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  await disconnectTikTokConnection(user.id);
}

export async function getTikTokDeliveryStatsForUser(
  ownerId: string,
): Promise<TikTokDeliveryStats | null> {
  const db = createDatabaseClient();
  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", ownerId);

  if (storesError || !stores?.length) {
    return { pending: 0, sent: 0, failed: 0 };
  }

  const { data, error } = await db
    .from("tiktok_conversion_deliveries")
    .select("status")
    .in(
      "store_id",
      stores.map((store) => store.id),
    );

  if (error || !data) {
    return null;
  }

  const stats: TikTokDeliveryStats = { pending: 0, sent: 0, failed: 0 };
  for (const row of data) {
    if (row.status === "sent") stats.sent += 1;
    else if (row.status === "failed") stats.failed += 1;
    else stats.pending += 1;
  }

  return stats;
}
