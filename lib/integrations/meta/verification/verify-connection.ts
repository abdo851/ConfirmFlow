import "server-only";

import {
  MetaPersistenceError,
  loadMetaConnectionForVerification,
  persistMetaVerificationResult,
} from "../persistence";
import { defaultMetaGraphTransport } from "../graph/transport";
import { verifyMetaCredentials } from "./verify-credentials";
import type {
  MetaCredentialVerificationResult,
  MetaGraphTransport,
} from "./types";

export async function verifyMetaConnectionForUser(input: {
  userId: string;
  storeId?: string;
  transport?: MetaGraphTransport;
}): Promise<MetaCredentialVerificationResult> {
  const context = await loadMetaConnectionForVerification(
    input.userId,
    input.storeId,
  );

  if (!context) {
    throw new MetaPersistenceError("Meta connection not found.");
  }

  const result = await verifyMetaCredentials({
    pixelId: context.pixelId,
    accessToken: context.accessToken,
    transport: input.transport ?? defaultMetaGraphTransport,
  });

  await persistMetaVerificationResult({
    storeConnectionId: context.storeConnectionId,
    result,
  });

  return result;
}
