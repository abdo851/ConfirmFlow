import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getShopifyConnectionPublicState } from "@/lib/integrations/shopify/session";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      {
        provider: "shopify",
        status: "error",
        errorMessage: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const state = await getShopifyConnectionPublicState();
    return NextResponse.json(state);
  } catch {
    return NextResponse.json(
      {
        provider: "shopify",
        status: "error",
        errorMessage: "Unable to read Shopify connection status.",
      },
      { status: 500 },
    );
  }
}
