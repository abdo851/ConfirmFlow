import "server-only";

import { cookies } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  WOOCOMMERCE_OAUTH_STATE_COOKIE,
  WOOCOMMERCE_OAUTH_STATE_TTL_SECONDS,
} from "../constants";
import { getWooCommerceConnectionStateForUser } from "../persistence";
import type { WooCommerceConnectionPublicState } from "../types";

function getSecureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function setWooCommerceOAuthStateCookie(
  state: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    WOOCOMMERCE_OAUTH_STATE_COOKIE,
    state,
    getSecureCookieOptions(WOOCOMMERCE_OAUTH_STATE_TTL_SECONDS),
  );
}

export async function getWooCommerceConnectionPublicState(): Promise<WooCommerceConnectionPublicState> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { connected: false };
  }

  return getWooCommerceConnectionStateForUser(user.id);
}
