import "server-only";

import type { ConversionEvent } from "@/lib/conversions/types";
import { buildMetaCapiEventsUrl } from "./config";
import { buildMetaCapiPayload } from "./payload-builder";
import type { MetaCapiRequestPayload, MetaCapiSendResult } from "./types";

export interface MetaCapiTransport {
  send(
    url: string,
    payload: MetaCapiRequestPayload,
    accessToken: string,
  ): Promise<{ status: number; body?: unknown }>;
}

function readEventsReceived(body: unknown): number | null {
  if (!body || typeof body !== "object" || !("events_received" in body)) {
    return null;
  }

  const received = (body as { events_received?: unknown }).events_received;
  return typeof received === "number" ? received : null;
}

function readResponseError(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const message = (body as { error?: { message?: unknown } }).error?.message;
  if (typeof message !== "string" || !message.trim()) {
    return null;
  }

  return message.replace(/access_token=[^&\s]+/gi, "access_token=[REDACTED]");
}

export class MetaCapiClient {
  private readonly transport?: MetaCapiTransport;

  constructor(transport?: MetaCapiTransport) {
    this.transport = transport;
  }

  buildEventsUrl(pixelId: string): string {
    return buildMetaCapiEventsUrl(pixelId);
  }

  buildPayload(event: ConversionEvent): MetaCapiRequestPayload {
    return buildMetaCapiPayload(event);
  }

  /**
   * Future delivery entry point. M4-B does not invoke production network transport.
   * When no transport is injected, this remains explicitly unimplemented.
   */
  async sendEvent(input: {
    pixelId: string;
    accessToken: string;
    event: ConversionEvent;
  }): Promise<MetaCapiSendResult> {
    if (!this.transport) {
      return {
        success: false,
        error: "Meta CAPI transport is not configured.",
      };
    }

    const payload = this.buildPayload(input.event);
    const url = this.buildEventsUrl(input.pixelId);

    try {
      const response = await this.transport.send(
        url,
        payload,
        input.accessToken,
      );
      const eventsReceived = readEventsReceived(response.body);
      const accepted =
        response.status >= 200 &&
        response.status < 300 &&
        eventsReceived !== 0;

      if (accepted) {
        return {
          success: true,
          status: response.status,
          body: response.body,
        };
      }

      return {
        success: false,
        status: response.status,
        body: response.body,
        error: readResponseError(response.body) ?? "Meta CAPI request failed.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Meta CAPI request failed.";
      return {
        success: false,
        status: 0,
        error: message.replace(/access_token=[^&\s]+/gi, "access_token=[REDACTED]"),
      };
    }
  }
}
