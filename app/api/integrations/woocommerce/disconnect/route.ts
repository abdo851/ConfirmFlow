import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  WooCommerceDisconnectError,
  disconnectWooCommerceForAuthenticatedUser,
} from "@/lib/integrations/woocommerce";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await disconnectWooCommerceForAuthenticatedUser();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WooCommerceDisconnectError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Unable to disconnect WooCommerce store." },
      { status: 500 },
    );
  }
}
