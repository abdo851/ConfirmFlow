import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { ShopifyDisconnectError } from "@/lib/integrations/shopify/disconnect";
import { ShopifyPersistenceError } from "@/lib/integrations/shopify/persistence";
import { clearShopifyConnection } from "@/lib/integrations/shopify/session";
import { ShopifyWebhookRegistrationError } from "@/lib/integrations/shopify/webhooks/register";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await clearShopifyConnection();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ShopifyDisconnectError && error.message === "unauthenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      error instanceof ShopifyWebhookRegistrationError ||
      error instanceof ShopifyPersistenceError
    ) {
      return NextResponse.json(
        { error: "Unable to disconnect Shopify store." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Unable to disconnect Shopify store." },
      { status: 500 },
    );
  }
}
