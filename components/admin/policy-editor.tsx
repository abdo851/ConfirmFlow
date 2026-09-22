"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { savePoliciesAction } from "@/lib/policies/actions";

export function PolicyEditor({ initialJson }: { initialJson: string }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(savePoliciesAction, {
    saved: false,
    error: null,
  });

  return (
    <form action={action} className="space-y-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("policiesJson")}
        <textarea
          name="policies"
          rows={18}
          defaultValue={initialJson}
          className="rounded-xl border border-line bg-surface px-3 py-2 font-mono text-xs font-normal"
        />
      </label>
      {state.saved ? <Toast tone="success">{t("policiesSaved")}</Toast> : null}
      {state.error ? <Toast tone="danger">{t("policiesInvalid")}</Toast> : null}
      <Button type="submit" loading={pending}>
        {t("save")}
      </Button>
    </form>
  );
}
