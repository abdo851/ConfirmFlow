import type { ConnectionStatus } from "@/lib/connections/types";

/** Public Meta connection state — never includes access tokens. */
export interface MetaConnectionPublicState {
  provider: "meta";
  status: ConnectionStatus;
  /** Masked Pixel/Dataset identifier, e.g. ****1234 */
  pixelId?: string;
  errorMessage?: string;
}
