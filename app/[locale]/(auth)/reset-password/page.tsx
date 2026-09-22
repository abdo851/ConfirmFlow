"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { updatePasswordAction } from "@/lib/auth/password-actions";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const [state, action, pending] = useActionState(updatePasswordAction, { error: null });

  return (
    <div className="space-y-4">
      <BackButton href="/login" label={common("back")} />
      <Card title={t("resetTitle")} description={t("resetDescription")} backdrop>
        <form action={action} className="space-y-4">
          <Input
            label={t("password")}
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <Input
            label={t("confirmPassword")}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={8}
          />
          {state.error === "mismatch" ? <Toast tone="danger">{t("errors.password_mismatch")}</Toast> : null}
          {state.error === "invalid" ? <Toast tone="danger">{t("passwordTooShort")}</Toast> : null}
          {state.error === "failed" ? <Toast tone="danger">{t("resetFailed")}</Toast> : null}
          <Button type="submit" className="w-full" loading={pending}>
            {t("savePassword")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
