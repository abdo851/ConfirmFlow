"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getAuthCallbackUrl } from "@/lib/config/urls";
import { isAppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PasswordResetState {
  sent: boolean;
}

export interface UpdatePasswordState {
  error: "mismatch" | "invalid" | "failed" | null;
}

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function requestPasswordReset(
  _previous: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const email = readField(formData, "email").trim();
  if (!email) {
    return { sent: true };
  }

  try {
    const locale = await getLocale();
    const safeLocale = isAppLocale(locale) ? locale : "en";
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthCallbackUrl(withLocalePath(safeLocale, "/reset-password")),
    });
  } catch {
    return { sent: true };
  }

  return { sent: true };
}

export async function updatePasswordAction(
  _previous: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = readField(formData, "password");
  const confirmPassword = readField(formData, "confirmPassword");

  if (password.length < 8) {
    return { error: "invalid" };
  }

  if (password !== confirmPassword) {
    return { error: "mismatch" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "failed" };
  }

  const locale = await getLocale();
  const safeLocale = isAppLocale(locale) ? locale : "en";
  redirect(withLocalePath(safeLocale, "/login"));
}
