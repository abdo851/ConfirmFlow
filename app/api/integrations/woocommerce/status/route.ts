import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getWooCommerceConnectionPublicState } from "@/lib/integrations/woocommerce";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await getWooCommerceConnectionPublicState();
    return NextResponse.json(state);
  } catch {
    return NextResponse.json(
      {
        connected: false,
        error_message: "Unable to read WooCommerce connection status.",
      },
      { status: 500 },
    );
  }
}
