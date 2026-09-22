"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

export function MetaVerifyButton() {
  const t = useTranslations("dashboard");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function verify() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/integrations/meta/verify", { method: "POST" });
    const body = (await response.json().catch(() => null)) as { message?: string; verificationStatus?: string } | null;
    setOk(response.ok);
    setMessage(body?.message || body?.verificationStatus || t("pages.verifyFailed"));
    setPending(false);
  }

  return (
    <div className="space-y-3">
      <Button type="button" loading={pending} onClick={() => void verify()}>
        {t("pages.testEvent")}
      </Button>
      {message ? <Toast tone={ok ? "success" : "danger"}>{message}</Toast> : null}
    </div>
  );
}
