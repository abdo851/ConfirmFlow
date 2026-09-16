import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * User-scoped Supabase client for RLS-protected database queries.
 * Uses the authenticated user's session — not the service role.
 */
export async function createUserDatabaseClient() {
  return createSupabaseServerClient();
}
