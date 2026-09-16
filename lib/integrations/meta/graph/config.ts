import { META_GRAPH_API_VERSION } from "../constants";

export function buildMetaGraphApiUrl(path: string): string {
  const normalizedPath = path.replace(/^\//, "");
  return `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${normalizedPath}`;
}

export function buildMetaGraphRequestUrl(
  path: string,
  accessToken: string,
  query: Record<string, string> = {},
): string {
  const url = new URL(buildMetaGraphApiUrl(path));
  url.searchParams.set("access_token", accessToken);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}
