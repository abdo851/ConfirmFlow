import { createClient } from "@supabase/supabase-js";
import "server-only";
import { getServerEnv } from "@/lib/validation/env";

/**
 * Server-side Supabase client with service role for database operations.
 * Use only in trusted server contexts (API routes, server actions).
 */
export function createDatabaseClient() {
  const env = getServerEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
