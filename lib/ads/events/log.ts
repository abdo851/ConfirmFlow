import { createDatabaseClient } from "@/lib/database/client";

const SENSITIVE_KEY = /email|phone|tel/i;
const ERROR_LIMIT = 500;
const PAYLOAD_LIMIT = 8192;

export type AdEventPlatform = "meta" | "tiktok" | "google";
export type AdEventStatus = "sent" | "failed" | "skipped";

export async function logAdEvent(input: {
  ownerId: string;
  orderId?: string;
  storeId?: string;
  platform: AdEventPlatform;
  eventName: string;
  status: AdEventStatus;
  httpStatus?: number;
  errorMessage?: string;
  payload?: unknown;
  responseSummary?: unknown;
}): Promise<void> {
  try {
    const db = createDatabaseClient();
    const { error } = await db.from("ad_events_log").insert({
      owner_id: input.ownerId,
      order_id: input.orderId ?? null,
      store_id: input.storeId ?? null,
      platform: input.platform,
      event_name: input.eventName,
      status: input.status,
      http_status: input.httpStatus ?? null,
      error_message: clipError(input.errorMessage),
      payload: limitJson(maskSensitive(input.payload)),
      response_summary: limitJson(maskSensitive(input.responseSummary)),
    });
    if (error) {
      console.warn("ad_event_log_failed");
    }
  } catch {
    console.warn("ad_event_log_failed");
  }
}

function maskSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitive(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const masked: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (typeof nested === "string" && SENSITIVE_KEY.test(key)) {
      masked[key] = "***";
    } else {
      masked[key] = maskSensitive(nested);
    }
  }
  return masked;
}

function clipError(message: string | undefined): string | null {
  if (!message) return null;
  return message.length > ERROR_LIMIT ? message.slice(0, ERROR_LIMIT) : message;
}

function limitJson(value: unknown): unknown {
  if (value === undefined) return null;
  const encoded = JSON.stringify(value);
  if (encoded.length <= PAYLOAD_LIMIT) return value;
  return { truncated: true, preview: encoded.slice(0, 1024) };
}
