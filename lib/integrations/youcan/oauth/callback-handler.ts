import type { YouCanOAuthStatePayload } from "./state";
import { normalizeStoreSlug } from "./store-slug";
import {
  exchangeYouCanAccessToken,
  type YouCanTokenExchangeResult,
} from "./token-exchange";

export interface YouCanCallbackInput {
  query: Record<string, string>;
  expectedState: YouCanOAuthStatePayload;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export type YouCanCallbackFailureReason =
  | "access_denied"
  | "invalid_parameters"
  | "invalid_store_slug"
  | "store_slug_mismatch"
  | "token_exchange_failed"
  | "missing_access_token";

export interface YouCanCallbackSuccess {
  ok: true;
  storeSlug: string;
  accessToken: string;
  scope?: string;
}

export interface YouCanCallbackFailure {
  ok: false;
  reason: YouCanCallbackFailureReason;
}

export type YouCanCallbackResult = YouCanCallbackSuccess | YouCanCallbackFailure;

export function validateCallbackParameters(query: Record<string, string>): {
  valid: boolean;
  denied?: boolean;
} {
  if (query.error === "access_denied") {
    return { valid: false, denied: true };
  }

  if (query.error) {
    return { valid: false };
  }

  return {
    valid: Boolean(query.code && query.state),
  };
}

export async function handleYouCanOAuthCallback(
  input: YouCanCallbackInput,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanCallbackResult> {
  const validation = validateCallbackParameters(input.query);

  if (validation.denied) {
    return { ok: false, reason: "access_denied" };
  }

  if (!validation.valid) {
    return { ok: false, reason: "invalid_parameters" };
  }

  const storeSlug = normalizeStoreSlug(input.expectedState.storeSlug);
  if (!storeSlug) {
    return { ok: false, reason: "invalid_store_slug" };
  }

  const tokenResult: YouCanTokenExchangeResult = await exchangeYouCanAccessToken(
    {
      code: input.query.code!,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      redirectUri: input.redirectUri,
    },
    fetchImpl,
  );

  if (!tokenResult.success) {
    return {
      ok: false,
      reason:
        tokenResult.error === "missing_access_token"
          ? "missing_access_token"
          : "token_exchange_failed",
    };
  }

  return {
    ok: true,
    storeSlug,
    accessToken: tokenResult.accessToken!,
    scope: tokenResult.scope,
  };
}
