import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { signupAction } from "@/lib/auth/actions";

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
      <form
        action={signupAction}
        className="space-y-4"
        aria-label={t("signupTitle")}
      >
        <Input
          label={t("email")}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          required
        />
        <Input
          label={t("password")}
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
          required
        />
        <Input
          label={t("confirmPassword")}
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
          required
        />
        {infoMessage ? <Toast tone="info">{infoMessage}</Toast> : null}
        {errorMessage ? <Toast tone="danger" role="alert">{errorMessage}</Toast> : null}
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
      </form>
      <p className="mt-4 text-sm text-muted">{t("trustHint")}</p>
      <p className="mt-4 text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          {t("hasAccount")}{" "}
        </span>
        <Link href="/login" className="underline">
          {t("signIn")}
        </Link>
      </p>
    </Card>
    </div>
  );
}
