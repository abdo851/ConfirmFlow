export const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";

export const GA4_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";

export const GOOGLE_ADS_API_VERSION = "v16";

export const GOOGLE_ADS_UPLOAD_URL =
  "https://googleads.googleapis.com/v16/customers/{customer_id}:uploadClickConversions";

export function buildGoogleAdsUploadUrl(customerId: string): string {
  return GOOGLE_ADS_UPLOAD_URL.replace("{customer_id}", encodeURIComponent(customerId));
}
