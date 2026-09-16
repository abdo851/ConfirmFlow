import { META_GRAPH_API_VERSION } from "../constants";

export { META_GRAPH_API_VERSION };

export function buildMetaCapiEventsUrl(pixelId: string): string {
  const normalizedPixelId = pixelId.trim();
  return `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${normalizedPixelId}/events`;
}
