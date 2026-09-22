import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brand = await getTranslations("common");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="animate-float absolute -start-20 top-0 size-80 rounded-full bg-indigo-400/25 blur-3xl" />
        <div className="animate-float-delayed absolute end-0 bottom-0 size-72 rounded-full bg-teal-300/25 blur-3xl" />
      </div>
      <div className="relative mb-6 flex w-full max-w-md items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-semibold">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            C
          </span>
          {brand("brand")}
        </Link>
        <LanguageSwitcher />
      </div>
      <div className="animate-fade-in relative w-full max-w-md">{children}</div>
    </div>
  );
}
