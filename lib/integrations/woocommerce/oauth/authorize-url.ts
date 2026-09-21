import { WOOCOMMERCE_AUTH_PATH } from "../constants";

export interface BuildWooCommerceAuthorizeUrlInput {
  store_url: string;
  user_id: string;
  return_url: string;
  callback_url: string;
  app_name: string;
  scope: string;
}

export function buildAuthorizeUrl(
  input: BuildWooCommerceAuthorizeUrlInput,
): string {
  const url = new URL(WOOCOMMERCE_AUTH_PATH, `${input.store_url}/`);
  url.searchParams.set("app_name", input.app_name);
  url.searchParams.set("scope", input.scope);
  url.searchParams.set("user_id", input.user_id);
  url.searchParams.set("return_url", input.return_url);
  url.searchParams.set("callback_url", input.callback_url);
  return url.toString();
}
