import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signupAction } from "@/lib/auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth");

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
    <Card title={t("signupTitle")} description={t("signupDescription")}>
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
        {infoMessage ? (
          <p
            className="text-sm text-blue-700 dark:text-blue-300"
            role="status"
          >
            {infoMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-red-700 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          {t("createAccount")}
        </Button>
      </form>
      <p className="mt-4 text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          {t("hasAccount")}{" "}
        </span>
        <Link href="/login" className="underline">
          {t("signIn")}
        </Link>
      </p>
    </Card>
  );
}
