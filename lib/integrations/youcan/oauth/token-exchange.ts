import { YOUCAN_OAUTH_TOKEN_URL } from "@/lib/integrations/youcan/constants";

export interface YouCanTokenExchangeInput {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface YouCanTokenExchangeResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  error?: string;
}

export async function exchangeYouCanAccessToken(
  input: YouCanTokenExchangeInput,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanTokenExchangeResult> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    code: input.code,
  });

  const response = await fetchImpl(YOUCAN_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  if (!response.ok) {
    return {
      success: false,
      error: "token_exchange_failed",
    };
  }

  const tokenBody = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
  };

  if (!tokenBody.access_token) {
    return {
      success: false,
      error: "missing_access_token",
    };
  }

  return {
    success: true,
    accessToken: tokenBody.access_token,
    refreshToken: tokenBody.refresh_token,
    scope: tokenBody.scope,
  };
}
