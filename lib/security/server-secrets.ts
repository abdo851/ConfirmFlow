import "server-only";

import { getServerEnv } from "@/lib/validation/env";

/**
 * Server-only secrets — must never be imported in client components.
 */
export function getServerSecrets() {
  const env = getServerEnv();
  return {
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}
