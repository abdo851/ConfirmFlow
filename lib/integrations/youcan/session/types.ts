import type { ConnectionStatus } from "@/lib/connections/types";

export interface YouCanConnectionPublicState {
  provider: "youcan";
  status: ConnectionStatus;
  storeSlug?: string;
  errorMessage?: string;
}
