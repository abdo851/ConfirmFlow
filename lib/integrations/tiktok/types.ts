import type { ConnectionStatus } from "@/lib/connections/types";

export type TikTokVerificationStatus =
  | "unverified"
  | "verified"
  | "credentials_valid"
  | "identifier_not_verified"
  | "failed";

export interface TikTokCredentialVerificationResult {
  status: TikTokVerificationStatus;
  message?: string;
}

/** Public TikTok connection state. Never includes the access token. */
export interface TikTokConnectionPublicState {
  provider: "tiktok";
  status: ConnectionStatus;
  pixelCode?: string;
  verificationStatus?: TikTokVerificationStatus;
  verifiedAt?: string;
  errorMessage?: string;
}

export interface TikTokDeliveryStats {
  pending: number;
  sent: number;
  failed: number;
}
