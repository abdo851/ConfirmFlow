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
    <div className="grid min-h-screen md:grid-cols-2 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-teal-500 text-white md:flex md:flex-col md:justify-between md:p-8 lg:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(20,184,166,0.35),transparent_40%)]" />
        <div aria-hidden className="animate-float absolute -top-16 end-10 size-40 rounded-full bg-white/20 blur-2xl" />
        <div aria-hidden className="animate-float-delayed absolute bottom-10 start-8 size-48 rounded-full bg-teal-200/30 blur-2xl" />
        <p className="relative text-lg font-semibold">{brand("brand")}</p>
        <div className="relative animate-fade-in">
          <p className="max-w-md text-3xl leading-[1.15] font-semibold text-balance lg:text-4xl">
            {auth("loginHeadline")}
          </p>
          <p className="mt-3 max-w-md text-sm text-white/85">{auth("loginSub")}</p>
          <div className="mt-8 max-w-sm rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur">
            <div className="mb-3 h-2 w-24 rounded-full bg-white/70" />
            <div className="grid grid-cols-3 gap-2">
              <span className="h-10 rounded-lg bg-white/25" />
              <span className="h-10 rounded-lg bg-white/15" />
              <span className="h-10 rounded-lg bg-emerald-200/40" />
            </div>
            <div className="mt-3 h-16 rounded-lg bg-white/10" />
          </div>
          <ul className="mt-8 space-y-3 text-sm">
            {[auth("trust1"), auth("trust2"), auth("trust3")].map((item, index) => (
              <li
                key={item}
                className="animate-fade-in flex items-center gap-2"
                style={{ animationDelay: `${120 + index * 90}ms` }}
              >
                <span aria-hidden>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/80">{auth("trustHint")}</p>
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
