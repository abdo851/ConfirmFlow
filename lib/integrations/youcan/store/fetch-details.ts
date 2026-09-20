import { YOUCAN_STORE_DETAILS_URL } from "@/lib/integrations/youcan/constants";
import { normalizeStoreSlug } from "@/lib/integrations/youcan/oauth/store-slug";

export interface YouCanStoreDetails {
  storeId: string;
  slug: string;
  name: string;
}

export async function fetchYouCanStoreDetails(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouCanStoreDetails | null> {
  const response = await fetchImpl(YOUCAN_STORE_DETAILS_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as {
    store_id?: string;
    id?: string;
    slug?: string;
    name?: string;
  };

  const storeId = body.store_id ?? body.id;
  const slug = body.slug ? normalizeStoreSlug(body.slug) : null;

  if (!storeId || !slug) {
    return null;
  }

  return {
    storeId,
    slug,
    name: body.name?.trim() || slug,
  };
}
