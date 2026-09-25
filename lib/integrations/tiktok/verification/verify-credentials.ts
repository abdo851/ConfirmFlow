import "server-only";

import { buildTikTokPayload } from "../capi/payload-builder";
import { sendEvent, type TikTokEventsTransport } from "../capi/client";
import type { TikTokCredentialVerificationResult } from "../types";
import {
  TikTokPersistenceError,
  loadTikTokConnectionForVerification,
  persistTikTokVerificationResult,
} from "../persistence";

export async function verifyTikTokCredentials(input: {
  pixelCode: string;
  accessToken: string;
  transport?: TikTokEventsTransport;
}): Promise<TikTokCredentialVerificationResult> {
  const pixelCode = input.pixelCode.trim();
  const accessToken = input.accessToken.trim();

  if (pixelCode.length < 5 || accessToken.length < 10) {
    return { status: "failed", message: "TikTok credentials are incomplete." };
  }

  const event = buildTikTokPayload({
    pixel_code: pixelCode,
    event_id: `verify-${pixelCode}`,
    confirmed_at: new Date().toISOString(),
    order: { currency: "USD", value: 0 },
  });

  const result = await sendEvent({
    pixel_code: pixelCode,
    access_token: accessToken,
    event,
    transport: input.transport,
  });

  if (result.status === 200) {
    return { status: "verified" };
  }

  if (result.status === 401 || result.status === 403) {
    return { status: "failed", message: "TikTok access token was rejected." };
  }

  return {
    status: "failed",
    message: "TikTok credential check did not succeed.",
  };
}

export async function verifyTikTokConnectionForUser(input: {
  ownerId: string;
  transport?: TikTokEventsTransport;
}): Promise<TikTokCredentialVerificationResult> {
  const context = await loadTikTokConnectionForVerification(input.ownerId);
  if (!context) {
    throw new TikTokPersistenceError("TikTok connection not found.");
  }

  const result = await verifyTikTokCredentials({
    pixelCode: context.pixelCode,
    accessToken: context.accessToken,
    transport: input.transport,
  });

  await persistTikTokVerificationResult({
    storeConnectionId: context.storeConnectionId,
    result,
  });

  return result;
}
