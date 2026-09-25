import type { ConnectionStatus } from "@/lib/connections/types";

export type GoogleVerificationStatus =
  | "unverified"
  | "verified"
  | "credentials_valid"
  | "identifier_not_verified"
  | "failed";

export interface GoogleCredentialVerificationResult {
  status: GoogleVerificationStatus;
  message?: string;
}

/** Public Google connection state. Never includes the access token. */
export interface GoogleConnectionPublicState {
  provider: "google";
  status: ConnectionStatus;
  measurementId?: string;
  conversionId?: string;
  conversionLabel?: string;
  verificationStatus?: GoogleVerificationStatus;
  verifiedAt?: string;
  errorMessage?: string;
}

export interface GoogleDeliveryStats {
  pending: number;
  sent: number;
  failed: number;
}
