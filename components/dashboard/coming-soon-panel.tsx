"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { joinFeatureWaitlistAction } from "@/lib/marketing/feature-waitlist-action";

export function ComingSoonPanel({ feature }: { feature: string }) {
  const t = useTranslations("dashboard");
  const auth = useTranslations("auth");
  const [state, action, pending] = useActionState(joinFeatureWaitlistAction, {
    status: "idle" as const,
  });

  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface-muted/50 p-6">
      <Badge variant="muted">{t("pages.comingSoon")}</Badge>
      <p className="mt-3 text-sm text-muted">{t("pages.comingSoonBody")}</p>
      <form action={action} className="mt-4 max-w-md space-y-3">
        <input type="hidden" name="feature" value={feature} />
        <Input label={auth("email")} name="email" type="email" required />
        <Button type="submit" loading={pending}>
          {t("pages.notifyMe")}
        </Button>
      </form>
      {state.status === "saved" ? <Toast tone="success">{t("pages.waitlistSaved")}</Toast> : null}
      {state.status === "invalid" ? <Toast tone="danger">{t("pages.waitlistInvalid")}</Toast> : null}
    </div>
  );
}
