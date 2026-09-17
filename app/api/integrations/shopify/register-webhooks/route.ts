import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createDatabaseClient } from "@/lib/database/client";
import {
  registerShopifyWebhooksForOwnedStore,
  ShopifyWebhookRegistrationError,
  toSafeWebhookRegistrationResponse,
} from "@/lib/integrations/shopify/webhooks/register";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createDatabaseClient();
  const { data: stores, error: storesError } = await db
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .eq("platform", "shopify")
    .limit(1);

  if (storesError) {
    return NextResponse.json(
      { error: "Unable to resolve Shopify store." },
      { status: 500 },
    );
  }

  const storeId = stores?.[0]?.id;
  if (!storeId) {
    return NextResponse.json(
      { error: "No connected Shopify store found." },
      { status: 404 },
    );
  }

  try {
    const result = await registerShopifyWebhooksForOwnedStore(storeId, user.id);
    return NextResponse.json(toSafeWebhookRegistrationResponse(result));
  } catch (error) {
    if (error instanceof ShopifyWebhookRegistrationError) {
      if (error.message === "shopify_store_forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json(
        {
          error: "Unable to register Shopify webhooks.",
          reason: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Unable to register Shopify webhooks." },
      { status: 500 },
    );
  }
}
