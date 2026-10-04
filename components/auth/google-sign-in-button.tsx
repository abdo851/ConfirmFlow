"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildGoogleOAuthRedirectUrl,
  requestGoogleOAuth,
  type GoogleOAuthOrigin,
} from "@/lib/auth/google-oauth";
import { getPublicConfig } from "@/lib/security/public-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleSignInButton({
  label,
  pendingLabel,
  nextPath,
  fallback,
  origin,
  disabled = false,
  onError,
}: {
  label: string;
  pendingLabel: string;
  nextPath?: string | null;
  fallback: string;
  origin: GoogleOAuthOrigin;
  disabled?: boolean;
  onError: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const { appUrl } = getPublicConfig();
      const redirectTo = buildGoogleOAuthRedirectUrl(
        appUrl,
        nextPath,
        fallback,
        origin,
      );
      const supabase = createSupabaseBrowserClient();
      const started = await requestGoogleOAuth(
        (request) => supabase.auth.signInWithOAuth(request),
        redirectTo,
      );
      if (!started) {
        console.warn("google_oauth_failed");
        onError();
        setPending(false);
      }
    } catch {
      console.warn("google_oauth_failed");
      onError();
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      loading={pending}
      disabled={disabled || pending}
      onClick={onClick}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
