"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
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

  if (!email || !password) {
    await redirectWithLocale("/login", "error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await redirectWithLocale("/login", "error=invalid_credentials");
  }

  await redirectWithLocale("/dashboard");
}

export async function signupAction(formData: FormData): Promise<void> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!email || !password || !confirmPassword) {
    await redirectWithLocale("/signup", "error=missing_fields");
  }

  if (password !== confirmPassword) {
    await redirectWithLocale("/signup", "error=password_mismatch");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    await redirectWithLocale("/signup", "error=signup_failed");
  }

  await redirectWithLocale("/onboarding");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await redirectWithLocale("/login");
}
