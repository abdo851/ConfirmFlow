import { createBrowserClient } from "@supabase/ssr";
import { getPublicConfig } from "@/lib/security/public-config";

/**
 * Supabase browser client for client-side usage.
 */
export function createSupabaseBrowserClient() {
  const config = getPublicConfig();
  return createBrowserClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
  );
}
