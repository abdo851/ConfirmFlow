"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { loginAction } from "@/lib/auth/actions";

export function LoginForm({
  errorMessage,
  nextPath,
}: {
  errorMessage: string | null;
  nextPath?: string;
}) {
  const t = useTranslations("auth");

  return (
    <form action={loginAction} className="space-y-4" aria-label={t("loginTitle")}>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <Input
        label={t("email")}
        type="email"
        name="email"
        autoComplete="email"
        placeholder={t("emailPlaceholder")}
        required
      />
      <PasswordField
        label={t("password")}
        name="password"
        autoComplete="current-password"
        placeholder={t("passwordPlaceholder")}
        revealLabel={t("revealField")}
        concealLabel={t("concealField")}
      />
      <p className="text-end text-sm">
        <Link href="/forgot-password" className="underline">
          {t("forgotPassword")}
        </Link>
      </p>
      {errorMessage ? (
        <Toast tone="danger" role="alert">
          {errorMessage}
        </Toast>
      ) : null}
      <LoginSubmit label={t("signInShort")} pendingLabel={t("signingIn")} />
      <button
        type="button"
        disabled
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium text-muted"
      >
        {t("googleSignIn")}
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {t("googleNote")}
        </span>
      </button>
    </form>
  );
}

function LoginSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-2">
      {pending ? (
        <p className="text-sm text-muted" role="status" aria-live="polite">
          {pendingLabel}
        </p>
      ) : null}
      <Button type="submit" className="w-full" loading={pending} disabled={pending} aria-busy={pending}>
        {pending ? pendingLabel : label}
      </Button>
    </div>
  );
}
