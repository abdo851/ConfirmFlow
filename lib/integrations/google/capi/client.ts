import "server-only";

import { buildGoogleAdsUploadUrl } from "../constants";
import { getGoogleEnv } from "../env";
import type { GoogleConversionPayload } from "./payload-builder";

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
