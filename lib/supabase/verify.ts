import "server-only";

import { createSupabaseServerClient } from "./server";

export interface SupabaseVerificationResult {
  configured: boolean;
  reachable: boolean;
  error?: string;
}

/**
 * Non-destructive Supabase connection verification.
 * Uses auth session lookup only — no schema changes or data writes.
 */
export async function verifySupabaseConnection(): Promise<SupabaseVerificationResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return {
        configured: true,
        reachable: false,
        error: "supabase_auth_unreachable",
      };
    }

    return {
      configured: true,
      reachable: true,
    };
  } catch {
    return {
      configured: false,
      reachable: false,
      error: "supabase_not_configured",
    };
  }
}
