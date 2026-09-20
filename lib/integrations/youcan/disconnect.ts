import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";

export class YouCanDisconnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouCanDisconnectError";
  }
}

export async function disconnectYouCanStoreForAuthenticatedUser(
  storeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new YouCanDisconnectError("unauthenticated");
  }

  const { disconnectYouCanStoreForUser } = await import(
    "@/lib/integrations/youcan/persistence"
  );
  await disconnectYouCanStoreForUser(user.id, storeId, fetchImpl);
}

export async function disconnectYouCanForAuthenticatedUser(
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new YouCanDisconnectError("unauthenticated");
  }

  const { disconnectYouCanConnectionForUser } = await import(
    "@/lib/integrations/youcan/persistence"
  );
  await disconnectYouCanConnectionForUser(user.id, fetchImpl);
}
