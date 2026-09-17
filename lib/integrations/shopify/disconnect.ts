import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";

export class ShopifyDisconnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyDisconnectError";
  }
}

export async function disconnectShopifyStoreForAuthenticatedUser(
  storeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new ShopifyDisconnectError("unauthenticated");
  }

  const { disconnectShopifyStoreForUser } = await import(
    "@/lib/integrations/shopify/persistence"
  );
  await disconnectShopifyStoreForUser(user.id, storeId, fetchImpl);
}

export async function disconnectShopifyForAuthenticatedUser(
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new ShopifyDisconnectError("unauthenticated");
  }

  const { disconnectShopifyConnectionForUser } = await import(
    "@/lib/integrations/shopify/persistence"
  );
  await disconnectShopifyConnectionForUser(user.id, fetchImpl);
}
