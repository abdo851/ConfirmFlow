import "server-only";

import { TIKTOK_EVENTS_API_URL } from "../constants";
import type { TikTokEventPayload } from "./payload-builder";

export interface TikTokSendResult {
  status: number;
  body: unknown;
}

export interface TikTokEventsTransport {
  send(input: {
    url: string;
    accessToken: string;
    payload: TikTokEventPayload;
  }): Promise<TikTokSendResult>;
}

function redact(value: string): string {
  return value.replace(/access[_-]?token["']?\s*[:=]\s*["']?[^"'\s]+/gi, "access_token=[REDACTED]");
}

export const defaultTikTokEventsTransport: TikTokEventsTransport = {
  async send({ url, accessToken, payload }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": accessToken,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      });

      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      return { status: response.status, body };
    } catch (error) {
      const message = error instanceof Error ? redact(error.message) : "TikTok request failed.";
      return { status: 0, body: { message } };
    } finally {
      clearTimeout(timeout);
    }
  },
};

export async function sendEvent(input: {
  pixel_code: string;
  access_token: string;
  event: TikTokEventPayload;
  transport?: TikTokEventsTransport;
}): Promise<TikTokSendResult> {
  const transport = input.transport ?? defaultTikTokEventsTransport;
  const payload: TikTokEventPayload = {
    ...input.event,
    event_source_id: input.pixel_code,
  };

  return transport.send({
    url: TIKTOK_EVENTS_API_URL,
    accessToken: input.access_token,
    payload,
  });
}

export function tiktokResponseAccepted(result: TikTokSendResult): boolean {
  if (result.status < 200 || result.status >= 300) {
    return false;
  }

  if (!result.body || typeof result.body !== "object" || !("code" in result.body)) {
    return true;
  }

  return (result.body as { code?: unknown }).code === 0;
}
