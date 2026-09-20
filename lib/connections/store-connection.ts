import "server-only";

import { getDefaultConnectionState } from "./defaults";
import type { ConnectionState } from "./types";
import { getYouCanConnectionPublicState } from "@/lib/integrations/youcan/session";

export async function getStoreConnectionState(): Promise<ConnectionState> {
  const base = getDefaultConnectionState("store");
  const youcan = await getYouCanConnectionPublicState();

  return {
    ...base,
    status: youcan.status,
    metadata: {
      provider: "youcan",
      storeSlug: youcan.storeSlug,
      errorMessage: youcan.errorMessage,
    },
  };
}
