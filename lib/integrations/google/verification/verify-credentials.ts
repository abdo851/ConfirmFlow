import "server-only";

import { buildGA4Purchase } from "../capi/payload-builder";
import {
  readGa4ValidationMessages,
  sendGA4Event,
  type Ga4Transport,
} from "../capi/client";
import type { GoogleCredentialVerificationResult } from "../types";
import {
  GooglePersistenceError,
  loadGoogleConnectionForVerification,
  persistGoogleVerificationResult,
} from "../persistence";

export async function verifyGoogleCredentials(input: {
  measurementId: string;
  apiSecret: string;
  transport?: Ga4Transport;
}): Promise<GoogleCredentialVerificationResult> {
  const measurementId = input.measurementId.trim();
  const apiSecret = input.apiSecret.trim();

  if (!/^G-[A-Z0-9]+$/.test(measurementId) || apiSecret.length < 20) {
    return { status: "failed", message: "Google credentials are incomplete." };
  }

  const event = buildGA4Purchase({
    event_id: "ga4-verify",
    order: {
      id: "ga4-verify",
      external_order_id: "confirma.ga4.verify",
      order_number: "verify",
      total_amount_minor: 100,
      currency: "USD",
    },
  });

  const result = await sendGA4Event({
    measurement_id: measurementId,
    api_secret: apiSecret,
    event,
    debug: true,
    transport: input.transport,
  });

  const messages = readGa4ValidationMessages(result.body);
  if (result.status >= 200 && result.status < 300 && messages.length === 0) {
    return { status: "verified" };
  }

  return {
    status: "failed",
    message: messages[0] ?? "GA4 credential check did not succeed.",
  };
}

export async function verifyGoogleConnectionForUser(input: {
  ownerId: string;
  transport?: Ga4Transport;
}): Promise<GoogleCredentialVerificationResult> {
  const context = await loadGoogleConnectionForVerification(input.ownerId);
  if (!context) {
    throw new GooglePersistenceError("Google connection not found.");
  }

  const result = await verifyGoogleCredentials({
    measurementId: context.conversionId,
    apiSecret: context.accessToken,
    transport: input.transport,
  });

  await persistGoogleVerificationResult({
    storeConnectionId: context.storeConnectionId,
    result,
  });

  return result;
}
