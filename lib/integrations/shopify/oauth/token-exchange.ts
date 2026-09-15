export interface ShopifyTokenExchangeInput {
  shop: string;
  code: string;
  clientId: string;
  clientSecret: string;
}

export interface ShopifyTokenExchangeResult {
  success: boolean;
  accessToken?: string;
  scope?: string;
  error?: string;
}

export async function exchangeShopifyAccessToken(
  input: ShopifyTokenExchangeInput,
  fetchImpl: typeof fetch = fetch,
): Promise<ShopifyTokenExchangeResult> {
  const response = await fetchImpl(
    `https://${input.shop}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: input.clientId,
        client_secret: input.clientSecret,
        code: input.code,
      }),
    },
  );

  if (!response.ok) {
    return {
      success: false,
      error: "token_exchange_failed",
    };
  }

  const body = (await response.json()) as {
    access_token?: string;
    scope?: string;
  };

  if (!body.access_token) {
    return {
      success: false,
      error: "missing_access_token",
    };
  }

  return {
    success: true,
    accessToken: body.access_token,
    scope: body.scope,
  };
}
