import "server-only";

import { z } from "zod";
import { getYouCanOAuthCallbackUrl } from "@/lib/config/urls";

const youCanOAuthEnvSchema = z.object({
  YOUCAN_API_KEY: z.string().min(1),
  YOUCAN_API_SECRET: z.string().min(1),
  YOUCAN_SESSION_SECRET: z.string().min(32),
  YOUCAN_OAUTH_SCOPES: z
    .string()
    .min(1)
    .default("read-orders,read-products"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type YouCanOAuthEnv = z.infer<typeof youCanOAuthEnvSchema>;

export function getYouCanOAuthEnv(): YouCanOAuthEnv {
  return youCanOAuthEnvSchema.parse({
    YOUCAN_API_KEY: process.env.YOUCAN_API_KEY,
    YOUCAN_API_SECRET: process.env.YOUCAN_API_SECRET,
    YOUCAN_SESSION_SECRET: process.env.YOUCAN_SESSION_SECRET,
    YOUCAN_OAUTH_SCOPES:
      process.env.YOUCAN_OAUTH_SCOPES ?? "read-orders,read-products",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export function getYouCanRedirectUri(): string {
  return getYouCanOAuthCallbackUrl();
}

export function parseYouCanOAuthScopes(scopes: string): string[] {
  return scopes
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}
