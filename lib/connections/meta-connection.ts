import "server-only";

import { getDefaultConnectionState } from "./defaults";
import type { ConnectionState } from "./types";
import { getMetaConnectionPublicState } from "@/lib/integrations/meta/session";

export async function getMetaConnectionState(): Promise<ConnectionState> {
  const base = getDefaultConnectionState("meta");
  const meta = await getMetaConnectionPublicState();

  return {
    ...base,
    status: meta.status,
    metadata: {
      provider: "meta",
      errorMessage: meta.errorMessage,
    },
  };
}
