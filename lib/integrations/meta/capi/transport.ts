import "server-only";

import type { MetaCapiRequestPayload } from "./types";
import type { MetaCapiTransport } from "./client";

const META_CAPI_REQUEST_TIMEOUT_MS = 10_000;

function buildMetaCapiRequestUrl(url: string, accessToken: string): string {
  const requestUrl = new URL(url);
  requestUrl.searchParams.set("access_token", accessToken);
  return requestUrl.toString();
}

function sanitizeMetaErrorBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const message = (body as { error?: { message?: string } }).error?.message;
  if (!message) {
    return undefined;
  }

  return message.replace(/access_token=[^&\s]+/gi, "access_token=[REDACTED]");
}

export const defaultMetaCapiTransport: MetaCapiTransport = {
  async send(
    url: string,
    payload: MetaCapiRequestPayload,
    accessToken: string,
  ): Promise<{ status: number; body?: unknown }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), META_CAPI_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(buildMetaCapiRequestUrl(url, accessToken), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      });

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      if (response.status >= 400) {
        return {
          status: response.status,
          body: {
            error: {
              message:
                sanitizeMetaErrorBody(body) ?? "Meta CAPI request failed.",
            },
          },
        };
      }

      return {
        status: response.status,
        body,
      };
    } catch {
      return {
        status: 0,
        body: { error: { message: "Meta CAPI request timed out or failed." } },
      };
    } finally {
      clearTimeout(timeout);
    }
  },
};
