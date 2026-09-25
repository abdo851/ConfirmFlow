import "server-only";

import { GA4_DEBUG_ENDPOINT, GA4_ENDPOINT, buildGoogleAdsUploadUrl } from "../constants";
import { getGoogleEnv } from "../env";
import type { GA4PurchasePayload, GoogleConversionPayload } from "./payload-builder";

export interface GoogleSendResult {
  status: number;
  body: unknown;
}

export interface GoogleAdsTransport {
  send(input: {
    url: string;
    accessToken: string;
    developerToken: string;
    payload: GoogleConversionPayload;
  }): Promise<GoogleSendResult>;
}

export const defaultGoogleAdsTransport: GoogleAdsTransport = {
  async send({ url, accessToken, developerToken, payload }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
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
    } catch {
      return { status: 0, body: { message: "Google Ads request failed." } };
    } finally {
      clearTimeout(timeout);
    }
  },
};

export async function sendEvent(input: {
  customer_id: string;
  access_token: string;
  event: GoogleConversionPayload;
  transport?: GoogleAdsTransport;
}): Promise<GoogleSendResult> {
  const env = getGoogleEnv();
  if (!env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    return {
      status: 0,
      body: { message: "Google Ads developer token is not configured." },
    };
  }

  const transport = input.transport ?? defaultGoogleAdsTransport;
  return transport.send({
    url: buildGoogleAdsUploadUrl(input.customer_id),
    accessToken: input.access_token,
    developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
    payload: input.event,
  });
}

export function googleResponseAccepted(result: GoogleSendResult): boolean {
  return result.status >= 200 && result.status < 300;
}

function redactSecret(value: string): string {
  return value.replace(/api_secret=[^&\s]+/gi, "api_secret=[REDACTED]");
}

export interface Ga4Transport {
  send(input: { url: string; payload: GA4PurchasePayload }): Promise<GoogleSendResult>;
}

export const defaultGa4Transport: Ga4Transport = {
  async send({ url, payload }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      });

      let body: unknown = null;
      const text = await response.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = redactSecret(text);
        }
      }

      return { status: response.status, body };
    } catch {
      return { status: 0, body: { message: "GA4 request failed." } };
    } finally {
      clearTimeout(timeout);
    }
  },
};

export async function sendGA4Event(input: {
  measurement_id: string;
  api_secret: string;
  event: GA4PurchasePayload;
  debug?: boolean;
  transport?: Ga4Transport;
}): Promise<GoogleSendResult> {
  const useDebug = input.debug === true || process.env.GOOGLE_GA4_DEBUG === "true";
  const endpoint = useDebug ? GA4_DEBUG_ENDPOINT : GA4_ENDPOINT;
  const url = new URL(endpoint);
  url.searchParams.set("measurement_id", input.measurement_id.trim());
  url.searchParams.set("api_secret", input.api_secret.trim());

  const transport = input.transport ?? defaultGa4Transport;
  return transport.send({ url: url.toString(), payload: input.event });
}

export function readGa4ValidationMessages(body: unknown): string[] {
  if (!body || typeof body !== "object" || !("validationMessages" in body)) {
    return [];
  }

  const messages = (body as { validationMessages?: unknown }).validationMessages;
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.map((message) => {
    if (
      message &&
      typeof message === "object" &&
      "description" in message &&
      typeof message.description === "string"
    ) {
      return redactSecret(message.description);
    }

    return "GA4 validation failed.";
  });
}
