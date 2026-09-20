import { YOUCAN_OAUTH_AUTHORIZE_URL } from "@/lib/integrations/youcan/constants";

export interface BuildYouCanAuthorizeUrlInput {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes: string[];
}

export function buildYouCanAuthorizeUrl(
  input: BuildYouCanAuthorizeUrlInput,
): string {
  const url = new URL(YOUCAN_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", input.state);

  for (const scope of input.scopes) {
    url.searchParams.append("scope[]", scope);
  }

  return url.toString();
}
