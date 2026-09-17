import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth");

  const errorMessage = params.error
    ? t(`errors.${params.error}` as "errors.missing_fields", {
        default: t("errors.genericLogin"),
      })
    : null;

  return (
    <Card title={t("loginTitle")} description={t("loginDescription")}>
      <form action={loginAction} className="space-y-4" aria-label={t("loginTitle")}>
        {params.next ? (
          <input type="hidden" name="next" value={params.next} />
        ) : null}
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
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          required
        />
        {errorMessage ? (
          <p className="text-sm text-red-700 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          {t("signIn")}
        </Button>
      </form>
      <p className="mt-4 text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          {t("noAccount")}{" "}
        </span>
        <Link href="/signup" className="underline">
          {t("createAccount")}
        </Link>
      </p>
      <p className="mt-2 text-sm">
        <Link href="/" className="underline">
          {t("backToHome")}
        </Link>
      </p>
    </Card>
  );
}
