import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  disconnectMetaConnectionForUser,
  getMetaConnectionStateForUser,
} from "@/lib/integrations/meta/persistence";
import type { MetaConnectionPublicState } from "@/lib/integrations/meta/types";

export async function clearMetaConnection(): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  await disconnectMetaConnectionForUser(user.id);
}

export async function getMetaConnectionPublicState(): Promise<MetaConnectionPublicState> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      provider: "meta",
      status: "not_connected",
    };
  }

  const persisted = await getMetaConnectionStateForUser(user.id);
  if (!persisted) {
    return {
      provider: "meta",
      status: "not_connected",
    };
  }

  return persisted;
}
