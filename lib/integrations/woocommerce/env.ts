import "server-only";

import { z } from "zod";
import { WOOCOMMERCE_DEFAULT_APP_NAME } from "./constants";

const wooCommerceEnvSchema = z.object({
  WOOCOMMERCE_SESSION_SECRET: z.string().min(32),
  WOOCOMMERCE_APP_NAME: z.string().min(1).default(WOOCOMMERCE_DEFAULT_APP_NAME),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type WooCommerceEnv = z.infer<typeof wooCommerceEnvSchema>;

export function getWooCommerceEnv(): WooCommerceEnv {
  return wooCommerceEnvSchema.parse({
    WOOCOMMERCE_SESSION_SECRET: process.env.WOOCOMMERCE_SESSION_SECRET,
    WOOCOMMERCE_APP_NAME:
      process.env.WOOCOMMERCE_APP_NAME ?? WOOCOMMERCE_DEFAULT_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}
