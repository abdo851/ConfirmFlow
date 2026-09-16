import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Supabase browser client — auth flows implemented in future milestones.
 */
export function createAuthBrowserClient() {
  return createSupabaseBrowserClient();
}
