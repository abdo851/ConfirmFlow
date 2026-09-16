import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import "server-only";
import { getPublicConfig } from "@/lib/security/public-config";

/**
 * Supabase server client for authenticated server-side operations.
 */
export async function createSupabaseServerClient() {
  const config = getPublicConfig();
  const cookieStore = await cookies();

  return createServerClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can fail in Server Components — middleware handles refresh
          }
        },
      },
    },
  );
}
