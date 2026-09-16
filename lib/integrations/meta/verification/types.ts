export type MetaVerificationStatus =
  | "unverified"
  | "verified"
  | "credentials_valid"
  | "identifier_not_verified"
  | "failed";

export interface MetaCredentialVerificationResult {
  status: MetaVerificationStatus;
  /** Safe user-facing message — never includes tokens or raw Graph API secrets. */
  message?: string;
}

export interface MetaGraphGetResponse {
  status: number;
  body: unknown;
}

export interface MetaGraphTransport {
  get(url: string): Promise<MetaGraphGetResponse>;
}
