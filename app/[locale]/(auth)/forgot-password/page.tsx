"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/auth/password-actions";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const [state, action, pending] = useActionState(requestPasswordReset, { sent: false });

  return (
    <div className="space-y-4">
      <BackButton href="/login" label={common("back")} />
      <Card title={t("forgotTitle")} description={t("forgotDescription")} backdrop>
        {state.sent ? (
          <p className="text-sm">{t("resetSent")}</p>
        ) : (
          <form action={action} className="space-y-4">
            <Input
              label={t("email")}
              type="email"
              name="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              required
            />
            <Button type="submit" className="w-full" loading={pending}>
              {t("sendResetLink")}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
