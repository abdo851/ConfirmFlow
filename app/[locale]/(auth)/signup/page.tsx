import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/components/auth/signup-form";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth");
  const common = await getTranslations("common");

  const errorMessage = params.error
    ? t(`errors.${params.error}` as "errors.missing_fields", {
        default: t("errors.genericSignup"),
      })
    : null;

  const infoMessage = params.message
    ? t(`messages.${params.message}` as "messages.confirm_email", {
        default: t("messages.generic"),
      })
    : null;

  return (
    <div className="space-y-4">
    <BackButton href="/" label={common("back")} />
    <Card title={t("signupTitle")} description={t("signupDescription")} backdrop>
      <SignupForm errorMessage={errorMessage} infoMessage={infoMessage} />
    </Card>
    </div>
  );
}
