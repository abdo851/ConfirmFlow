import { NextResponse } from "next/server";
import { getShopifyConnectionPublicState } from "@/lib/integrations/shopify/session";

export async function GET() {
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
