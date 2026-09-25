import "server-only";

import type { GoogleCredentialVerificationResult } from "../types";
import {
  GooglePersistenceError,
  loadGoogleConnectionForVerification,
  persistGoogleVerificationResult,
} from "../persistence";

/**
 * Format-only check. Real Google OAuth and a developer-token call are later work.
 */
export async function verifyGoogleCredentials(input: {
  conversionId: string;
  accessToken: string;
}): Promise<GoogleCredentialVerificationResult> {
  const conversionId = input.conversionId.trim();
  const accessToken = input.accessToken.trim();

  if (conversionId.length < 3 || accessToken.length < 10) {
    return { status: "failed", message: "Google credentials are incomplete." };
  }

  return {
    status: "verified",
    message: "Token format accepted. Live Google OAuth is not connected yet.",
  };
}

export async function verifyGoogleConnectionForUser(input: {
  ownerId: string;
}): Promise<GoogleCredentialVerificationResult> {
  const context = await loadGoogleConnectionForVerification(input.ownerId);
  if (!context) {
    throw new GooglePersistenceError("Google connection not found.");
  }

  const result = await verifyGoogleCredentials({
    conversionId: context.conversionId,
    accessToken: context.accessToken,
  });

  await persistGoogleVerificationResult({
    storeConnectionId: context.storeConnectionId,
    result,
  });

  return result;
}
