export interface OrderTimelineEvent {
  key: "received" | "confirmed" | "meta";
  at: string | null;
  status?: string | null;
}

export function buildOrderTimeline(input: {
  receivedAt: string;
  confirmedAt: string | null;
  metaAttemptedAt: string | null;
  metaStatus: string | null;
}): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [{ key: "received", at: input.receivedAt }];
  if (input.confirmedAt) {
    events.push({ key: "confirmed", at: input.confirmedAt });
  }
  if (input.metaStatus) {
    events.push({
      key: "meta",
      at: input.metaAttemptedAt,
      status: input.metaStatus,
    });
  }
  return events;
}

export function wooAdminOrderUrl(storeUrl: string, externalOrderId: string): string {
  const base = storeUrl.replace(/\/$/, "");
  return `${base}/wp-admin/post.php?post=${encodeURIComponent(externalOrderId)}&action=edit`;
}
