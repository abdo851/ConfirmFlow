import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { disconnectWooCommerceConnectionForUser } from "./persistence";

export class WooCommerceDisconnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WooCommerceDisconnectError";
  }
}

export async function disconnectWooCommerceForAuthenticatedUser(): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new WooCommerceDisconnectError("unauthenticated");
  }

  await disconnectWooCommerceConnectionForUser(user.id);
}
