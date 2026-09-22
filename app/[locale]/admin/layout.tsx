import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { BackButton } from "@/components/ui/back-button";
import { isAdminRole } from "@/lib/admin/roles";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createUserDatabaseClient } from "@/lib/database/user-client";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const db = await createUserDatabaseClient();
  const { data } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!isAdminRole(data?.role)) {
    return redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("admin");
  const common = await getTranslations("common");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <BackButton href="/dashboard" label={common("back")} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <nav className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/admin" className="underline">
            {t("nav.blocks")}
          </Link>
          <Link href="/admin/policies" className="underline">
            {t("nav.policies")}
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
