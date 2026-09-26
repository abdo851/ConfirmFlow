"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { signupAction } from "@/lib/auth/actions";

export function SignupForm({
  errorMessage,
  infoMessage,
}: {
  errorMessage: string | null;
  infoMessage: string | null;
}) {
  const t = useTranslations("auth");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") ?? "").trim();
    const fullName = String(data.get("fullName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    const next: Record<string, string> = {};

    if (!/^[a-z0-9]{3,}$/.test(username)) {
      next.username = t("usernameInvalid");
    }
    if (!fullName) {
      next.fullName = t("errors.missing_fields");
    }
    if (!email) {
      next.email = t("errors.missing_fields");
    }
    if (password.length < 8) {
      next.password = t("passwordTooShort");
    }
    if (password !== confirmPassword) {
      next.confirmPassword = t("errors.password_mismatch");
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      event.preventDefault();
    }
  }

  const eye = (pressed: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      className="inline-flex size-11 items-center justify-center text-muted"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
        {pressed ? (
          <path d="M4 4l16 16M9.5 9.7A4 4 0 0 0 14.3 14.5M6.1 6.4C4.3 7.8 3 9.7 3 12c2.2 4 5.4 6 9 6 1.5 0 2.9-.3 4.1-.9M10 6.1A10 10 0 0 1 12 6c3.6 0 6.8 2 9 6-.5 1-1.2 1.9-2 2.7" />
        ) : (
          <>
            <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
            <circle cx="12" cy="12" r="2.5" />
          </>
        )}
      </svg>
    </button>
  );

  return (
    <form action={signupAction} className="space-y-4" aria-label={t("signupTitle")} onSubmit={onSubmit}>
      <Input
        label={t("username")}
        name="username"
        autoComplete="username"
        placeholder={t("usernamePlaceholder")}
        required
        error={errors.username}
      />
      <Input
        label={t("fullName")}
        name="fullName"
        autoComplete="name"
        placeholder={t("fullNamePlaceholder")}
        required
        error={errors.fullName}
      />
      <Input
        label={t("email")}
        type="email"
        name="email"
        autoComplete="email"
        placeholder={t("emailPlaceholder")}
        required
        error={errors.email}
      />
      <Input
        label={t("password")}
        type={showPassword ? "text" : "password"}
        name="password"
        autoComplete="new-password"
        placeholder={t("passwordPlaceholder")}
        minLength={8}
        required
        error={errors.password}
        suffix={eye(showPassword, () => setShowPassword((value) => !value), t("password"))}
      />
      <Input
        label={t("confirmPassword")}
        type={showConfirm ? "text" : "password"}
        name="confirmPassword"
        autoComplete="new-password"
        placeholder={t("passwordPlaceholder")}
        minLength={8}
        required
        error={errors.confirmPassword}
        suffix={eye(showConfirm, () => setShowConfirm((value) => !value), t("confirmPassword"))}
      />
      {infoMessage ? <Toast tone="info">{infoMessage}</Toast> : null}
      {errorMessage ? (
        <Toast tone="danger" role="alert">
          {errorMessage}
        </Toast>
      ) : null}
      <Button type="submit" className="w-full">
        {t("createAccount")}
      </Button>
      <button
        type="button"
        disabled
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line text-sm font-medium text-muted"
      >
        {t("googleSignIn")}
      </button>
      <p className="text-xs text-muted">{t("googleNote")}</p>
      <p className="text-sm text-muted">{t("trustHint")}</p>
      <p className="text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">{t("hasAccount")} </span>
        <Link href="/login" className="underline">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
