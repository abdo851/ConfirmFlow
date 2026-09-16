/** Centralized Meta Graph API version for Conversions API. */
export const META_GRAPH_API_VERSION = "v21.0";

export function buildMetaCapiEventsUrl(pixelId: string): string {
  const normalizedPixelId = pixelId.trim();
  return `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${normalizedPixelId}/events`;
}
