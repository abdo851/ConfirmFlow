import { createClient } from "@supabase/supabase-js";
import "server-only";
import { getSupabasePublicEnv } from "@/lib/validation/env";

/**
 * Server-side Supabase client with service role for admin database operations.
 * Required for shopify_connection_secrets and other server-only tables.
 * Not configured until explicitly added to the environment.
 */
export function createDatabaseClient() {
  const env = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local for server-side admin database access.",
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
