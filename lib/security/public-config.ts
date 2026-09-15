import { getPublicEnv } from "@/lib/validation/env";

/**
 * Public configuration safe for client-side use.
 */
export function getPublicConfig() {
  const env = getPublicEnv();
  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appUrl: env.NEXT_PUBLIC_APP_URL,
  };
}
