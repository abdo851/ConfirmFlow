import "server-only";

/**
 * Server-only secrets — must never be imported in client components.
 * Service role key is optional until a future database milestone.
 */
export function getServerSecrets() {
  return {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? null,
  };
}
