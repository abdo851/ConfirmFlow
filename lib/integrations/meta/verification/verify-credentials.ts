import { buildMetaGraphRequestUrl } from "../graph/config";
import type {
  MetaCredentialVerificationResult,
  MetaGraphTransport,
  MetaVerificationStatus,
} from "./types";

function parseGraphErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const error = (body as { error?: { message?: string } }).error?.message;
  if (!error) {
    return undefined;
  }

  return error.replace(/access_token=[^&\s]+/gi, "access_token=[REDACTED]");
}

function isMatchingPixelId(responseId: unknown, configuredPixelId: string): boolean {
  if (responseId === undefined || responseId === null) {
    return false;
  }

  return String(responseId) === configuredPixelId.trim();
}

/**
 * Read-only Meta Graph API credential verification.
 * Never calls Conversions API /events endpoints.
 */
export async function verifyMetaCredentials(input: {
  pixelId: string;
  accessToken: string;
  transport: MetaGraphTransport;
}): Promise<MetaCredentialVerificationResult> {
  const pixelId = input.pixelId.trim();
  const accessToken = input.accessToken.trim();

  if (!pixelId || !accessToken) {
    return {
      status: "failed",
      message: "Meta credentials are incomplete.",
    };
  }

  const meUrl = buildMetaGraphRequestUrl("me", accessToken, { fields: "id" });
  const meResponse = await input.transport.get(meUrl);

  if (meResponse.status === 401 || meResponse.status === 403) {
    return {
      status: "failed",
      message: "Meta access token is invalid or expired.",
    };
  }

  if (meResponse.status !== 200) {
    return {
      status: "failed",
      message:
        parseGraphErrorMessage(meResponse.body) ??
        "Unable to verify Meta access token.",
    };
  }

  const pixelUrl = buildMetaGraphRequestUrl(pixelId, accessToken, { fields: "id" });
  const pixelResponse = await input.transport.get(pixelUrl);

  if (pixelResponse.status === 200) {
    const pixelBody = pixelResponse.body as { id?: string | number };
    if (isMatchingPixelId(pixelBody.id, pixelId)) {
      return { status: "verified" };
    }

    return {
      status: "identifier_not_verified",
      message:
        "Meta credentials are valid, but the configured Pixel/Dataset identifier could not be confirmed.",
    };
  }

  if (pixelResponse.status === 404 || pixelResponse.status === 403) {
    return {
      status: "identifier_not_verified",
      message:
        "Meta credentials are valid, but the configured Pixel/Dataset is not accessible with this token.",
    };
  }

  const fallbackStatus: MetaVerificationStatus = "credentials_valid";
  return {
    status: fallbackStatus,
    message:
      "Meta credentials appear valid, but Pixel/Dataset access could not be fully verified.",
  };
}
