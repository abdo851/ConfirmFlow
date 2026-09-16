import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { MetaConnectForm } from "./meta-connect-form";

export async function MetaProviderPanel() {
  const t = await getTranslations("connections");

  return (
    <Suspense fallback={<p className="text-sm">{t("loadingMeta")}</p>}>
      <MetaConnectForm />
    </Suspense>
  );
}
