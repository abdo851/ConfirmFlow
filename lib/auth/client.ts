import { createBrowserClient } from "@supabase/ssr";
import { getPublicConfig } from "@/lib/security/public-config";

/**
 * Supabase browser client — auth flows implemented in future milestones.
 */
export function createAuthBrowserClient() {
  const config = getPublicConfig();
  return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
}
