import type { ShopifyOAuthStatePayload } from "./state";
import { verifyShopifyCallbackHmac, validateCallbackParameters } from "./hmac";
import { normalizeShopDomain } from "./shop-domain";
import {
  exchangeShopifyAccessToken,
  type ShopifyTokenExchangeResult,
} from "./token-exchange";

export interface ShopifyCallbackInput {
  query: Record<string, string>;
  expectedState: ShopifyOAuthStatePayload;
  clientId: string;
  clientSecret: string;
}

export type ShopifyCallbackFailureReason =
  | "invalid_parameters"
  | "invalid_shop"
  | "shop_mismatch"
  | "invalid_hmac"
  | "token_exchange_failed"
  | "missing_access_token";

export interface ShopifyCallbackSuccess {
  ok: true;
  shop: string;
  accessToken: string;
  scope?: string;
}

export interface ShopifyCallbackFailure {
  ok: false;
  reason: ShopifyCallbackFailureReason;
}

export type ShopifyCallbackResult = ShopifyCallbackSuccess | ShopifyCallbackFailure;

export async function handleShopifyOAuthCallback(
  input: ShopifyCallbackInput,
  fetchImpl: typeof fetch = fetch,
): Promise<ShopifyCallbackResult> {
  const validation = validateCallbackParameters({
    code: input.query.code,
    shop: input.query.shop,
    state: input.query.state,
    hmac: input.query.hmac,
  });

  if (!validation.valid) {
    return { ok: false, reason: "invalid_parameters" };
  }

  const shop = normalizeShopDomain(input.query.shop!);
  if (!shop) {
    return { ok: false, reason: "invalid_shop" };
  }

  if (shop !== input.expectedState.shop) {
    return { ok: false, reason: "shop_mismatch" };
  }

  if (!verifyShopifyCallbackHmac(input.query, input.clientSecret)) {
    return { ok: false, reason: "invalid_hmac" };
  }

  const tokenResult: ShopifyTokenExchangeResult = await exchangeShopifyAccessToken(
    {
      shop,
      code: input.query.code!,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
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
    shop,
    accessToken: tokenResult.accessToken!,
    scope: tokenResult.scope,
  };
}
