import "server-only";

import { verifyShopifyConnectionActive } from "./session";

export async function verifyShopifyStoreConnection(): Promise<boolean> {
  return verifyShopifyConnectionActive();
}
