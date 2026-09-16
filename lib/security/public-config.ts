import { getSupabasePublicEnv } from "@/lib/validation/env";

/**
 * Public configuration safe for client-side use.
 */
export function getPublicConfig() {
  const env = getSupabasePublicEnv();
  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    appUrl: env.NEXT_PUBLIC_APP_URL,
  };
}
