import "server-only";

import { z } from "zod";
import { getShopifyOAuthCallbackUrl } from "@/lib/config/urls";

const shopifyOAuthEnvSchema = z.object({
  SHOPIFY_API_KEY: z.string().min(1),
  SHOPIFY_API_SECRET: z.string().min(1),
  SHOPIFY_SESSION_SECRET: z.string().min(32),
  SHOPIFY_OAUTH_SCOPES: z.string().min(1).default("read_products,read_orders"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type ShopifyOAuthEnv = z.infer<typeof shopifyOAuthEnvSchema>;

export function getShopifyOAuthEnv(): ShopifyOAuthEnv {
  return shopifyOAuthEnvSchema.parse({
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
    SHOPIFY_SESSION_SECRET: process.env.SHOPIFY_SESSION_SECRET,
    SHOPIFY_OAUTH_SCOPES:
      process.env.SHOPIFY_OAUTH_SCOPES ?? "read_products,read_orders",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export function getShopifyRedirectUri(): string {
  return getShopifyOAuthCallbackUrl();
}
