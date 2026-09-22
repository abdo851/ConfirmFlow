import "server-only";

import { createUserDatabaseClient } from "@/lib/database/user-client";

export async function getLatestMetaDeliverySummary(): Promise<string | null> {
  const db = await createUserDatabaseClient();
  const { data, error } = await db
    .from("meta_conversion_deliveries")
    .select("status, last_attempted_at, last_error")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const when = data.last_attempted_at ?? "";
  const detail = data.last_error ? ` — ${data.last_error}` : "";
  return `${data.status}${when ? ` ${when}` : ""}${detail}`;
}
