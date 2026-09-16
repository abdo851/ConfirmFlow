import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase server client for authenticated server-side operations.
 */
export async function createAuthServerClient() {
  return createSupabaseServerClient();
}
