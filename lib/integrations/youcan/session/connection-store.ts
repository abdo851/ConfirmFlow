import "server-only";

import { cookies } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { disconnectYouCanForAuthenticatedUser } from "@/lib/integrations/youcan/disconnect";
import { getYouCanConnectionStateForUser } from "@/lib/integrations/youcan/persistence";
import {
  YOUCAN_CONNECTING_COOKIE,
  YOUCAN_CONNECTING_TTL_SECONDS,
} from "@/lib/integrations/youcan/oauth";
import type { YouCanConnectionPublicState } from "./types";

function getSecureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function setYouCanConnectingFlag(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    YOUCAN_CONNECTING_COOKIE,
    "1",
    getSecureCookieOptions(YOUCAN_CONNECTING_TTL_SECONDS),
  );
}

export async function clearYouCanConnectingFlag(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(YOUCAN_CONNECTING_COOKIE);
}

export async function clearYouCanConnection(): Promise<void> {
  await disconnectYouCanForAuthenticatedUser();
}

export async function getYouCanConnectionPublicState(): Promise<YouCanConnectionPublicState> {
  const cookieStore = await cookies();
  const connecting = cookieStore.get(YOUCAN_CONNECTING_COOKIE)?.value === "1";

  if (connecting) {
    return {
      provider: "youcan",
      status: "connecting",
    };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      provider: "youcan",
      status: "not_connected",
    };
  }

  const persisted = await getYouCanConnectionStateForUser(user.id);
  if (!persisted) {
    return {
      provider: "youcan",
      status: "not_connected",
    };
  }

  return persisted;
}
