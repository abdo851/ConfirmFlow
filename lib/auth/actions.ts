"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { resolveLoginFlow } from "@/lib/auth/login-flow";
import { resolveSignupFlow } from "@/lib/auth/signup-flow";
import { getAuthCallbackUrl } from "@/lib/config/urls";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withLocalePath } from "@/lib/i18n/paths";
import { isAppLocale } from "@/lib/i18n/locales";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function redirectWithLocale(path: string, query?: string) {
  const locale = await getLocale();
  const safeLocale = isAppLocale(locale) ? locale : "en";
  const localizedPath = withLocalePath(safeLocale, path);
  redirect(query ? `${localizedPath}?${query}` : localizedPath);
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const next = getString(formData, "next") || null;

  const preAuthResult = resolveLoginFlow({
    hasRequiredFields: Boolean(email && password),
    authError: false,
    next,
  });

  if (preAuthResult.type === "error") {
    const query = next
      ? `error=missing_fields&next=${encodeURIComponent(next)}`
      : "error=missing_fields";
    await redirectWithLocale("/login", query);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  const result = resolveLoginFlow({
    hasRequiredFields: true,
    authError: Boolean(error),
    next,
  });

  if (result.type === "error") {
    const query = next
      ? `error=invalid_credentials&next=${encodeURIComponent(next)}`
      : "error=invalid_credentials";
    await redirectWithLocale("/login", query);
  }

  if (result.type === "redirect") {
    await redirectWithLocale(result.path);
  }
}

export async function signupAction(formData: FormData): Promise<void> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  const preSignupResult = resolveSignupFlow({
    hasRequiredFields: Boolean(email && password && confirmPassword),
    passwordsMatch: password === confirmPassword,
    authError: false,
    hasSession: false,
    hasUser: false,
  });

  if (preSignupResult.type === "error") {
    await redirectWithLocale("/signup", `error=${preSignupResult.code}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/onboarding"),
    },
  });

  const result = resolveSignupFlow({
    hasRequiredFields: true,
    passwordsMatch: true,
    authError: Boolean(error),
    hasSession: Boolean(data.session),
    hasUser: Boolean(data.user),
  });

  if (result.type === "error") {
    await redirectWithLocale("/signup", `error=${result.code}`);
  }

  if (result.type === "confirm_email") {
    await redirectWithLocale("/signup", "message=confirm_email");
  }

  if (result.type === "redirect") {
    await redirectWithLocale(result.path);
  }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await redirectWithLocale("/login");
}
