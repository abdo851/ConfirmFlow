import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth");
  const common = await getTranslations("common");

  const errorMessage = params.error
    ? t(`errors.${params.error}` as "errors.missing_fields", {
        default: t("errors.genericLogin"),
      })
    : null;

  return (
    <div className="space-y-4">
    <BackButton href="/" label={common("back")} />
    <Card title={t("loginTitle")} description={t("loginDescription")} backdrop>
      <LoginForm errorMessage={errorMessage} nextPath={params.next} />
      <p className="mt-4 text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          {t("noAccount")}{" "}
        </span>
        <Link href="/signup" className="underline">
          {t("createAccount")}
        </Link>
      </p>
    </Card>
    </div>
  );
}
