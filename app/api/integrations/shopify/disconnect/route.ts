import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { clearShopifyConnection } from "@/lib/integrations/shopify/session";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await clearShopifyConnection();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to disconnect Shopify store." },
      { status: 500 },
    );
  }
}
