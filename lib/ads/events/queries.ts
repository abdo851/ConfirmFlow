import { createDatabaseClient } from "@/lib/database/client";
import type { AdEventPlatform, AdEventStatus } from "./log";

export type AdEventRow = {
  id: string;
  owner_id: string;
  order_id: string | null;
  store_id: string | null;
  platform: AdEventPlatform;
  event_name: string;
  status: AdEventStatus;
  http_status: number | null;
  error_message: string | null;
  payload: unknown;
  response_summary: unknown;
  sent_at: string;
};

export type AdEventStats = {
  platform: AdEventPlatform;
  sent: number;
  failed: number;
  skipped: number;
  lastSentAt: string | null;
};

const PLATFORMS: AdEventPlatform[] = ["meta", "tiktok", "google"];

export async function listAdEvents(
  ownerId: string,
  options: {
    platform?: AdEventPlatform;
    status?: AdEventStatus;
    since?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ rows: AdEventRow[]; total: number }> {
  const db = createDatabaseClient();
  const limit = Math.min(200, Math.max(1, options.limit ?? 50));
  const offset = Math.max(0, options.offset ?? 0);
  let query = db.from("ad_events_log").select("*", { count: "exact" }).eq("owner_id", ownerId);
  if (options.platform) query = query.eq("platform", options.platform);
  if (options.status) query = query.eq("status", options.status);
  if (options.since) query = query.gte("sent_at", options.since);
  const { data, error, count } = await query
    .order("sent_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error("ad_events_list_failed");
  }

  return {
    rows: ((data ?? []) as AdEventRow[]).map(toRow),
    total: count ?? 0,
  };
}

export async function getAdEventStats(ownerId: string): Promise<AdEventStats[]> {
  const db = createDatabaseClient();
  const { data, error } = await db
    .from("ad_events_log")
    .select("platform, status, sent_at")
    .eq("owner_id", ownerId);

  if (error) {
    throw new Error("ad_events_stats_failed");
  }

  return PLATFORMS.map((platform) => {
    const rows = (data ?? []).filter((row) => row.platform === platform);
    const sentRows = rows.filter((row) => row.status === "sent" && row.sent_at);
    return {
      platform,
      sent: rows.filter((row) => row.status === "sent").length,
      failed: rows.filter((row) => row.status === "failed").length,
      skipped: rows.filter((row) => row.status === "skipped").length,
      lastSentAt: sentRows.reduce<string | null>((latest, row) => {
        if (!latest || String(row.sent_at) > latest) return String(row.sent_at);
        return latest;
      }, null),
    };
  });
}

function toRow(row: AdEventRow): AdEventRow {
  return {
    id: row.id,
    owner_id: row.owner_id,
    order_id: row.order_id,
    store_id: row.store_id,
    platform: row.platform,
    event_name: row.event_name,
    status: row.status,
    http_status: row.http_status,
    error_message: row.error_message,
    payload: row.payload,
    response_summary: row.response_summary,
    sent_at: row.sent_at,
  };
}
