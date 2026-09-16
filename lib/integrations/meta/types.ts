import type { ConnectionStatus } from "@/lib/connections/types";
import type { MetaVerificationStatus } from "./verification/types";

/** Public Meta connection state — never includes access tokens. */
export interface MetaConnectionPublicState {
  provider: "meta";
  status: ConnectionStatus;
  /** Masked Pixel/Dataset identifier, e.g. ****1234 */
  pixelId?: string;
  verificationStatus?: MetaVerificationStatus;
  verifiedAt?: string;
  errorMessage?: string;
}
