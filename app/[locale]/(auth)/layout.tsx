import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brand = await getTranslations("common");
  const auth = await getTranslations("auth");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-teal-500 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="animate-float absolute -top-16 end-10 size-40 rounded-full bg-amber-300/30 blur-2xl" />
        <div aria-hidden className="animate-float-delayed absolute bottom-10 start-8 size-48 rounded-full bg-emerald-300/25 blur-2xl" />
        <p className="text-lg font-semibold">{brand("brand")}</p>
        <div>
          <p className="max-w-md text-4xl leading-[1.15] font-semibold text-balance">
            {auth("heroAside")}
          </p>
        </div>
        <p className="text-sm text-white/80">{auth("trustHint")}</p>
      </aside>
      <div className="bg-mesh relative flex flex-col justify-center px-4 py-8 sm:px-6">
        <div className="mb-6 flex w-full max-w-md items-center justify-between self-center">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-semibold lg:invisible">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              C
            </span>
            {brand("brand")}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="animate-fade-in relative w-full max-w-md self-center">{children}</div>
      </div>
    </div>
  );
}
