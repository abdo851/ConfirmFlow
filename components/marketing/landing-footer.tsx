import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Link } from "@/i18n/navigation";

export async function LandingFooter() {
  const landing = await getTranslations("landing");
  const nav = await getTranslations("navigation");
  const brand = await getTranslations("common");
  const policies = await getTranslations("policies");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-base font-semibold">{landing("footerCompany")}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">{landing("footer")}</p>
          <Link href="/" className="mt-3 inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground">
            {brand("home")}
          </Link>
        </div>
        <div>
          <p className="text-sm font-semibold">{landing("footerFeatures")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <a href="#features" className="inline-flex min-h-11 items-center hover:text-foreground">
                {landing("stepsTitle")}
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="inline-flex min-h-11 items-center hover:text-foreground">
                {landing("howItWorks")}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{landing("footerSupport")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/login" className="inline-flex min-h-11 items-center hover:text-foreground">
                {nav("signIn")}
              </Link>
            </li>
            <li>
              <Link href="/signup" className="inline-flex min-h-11 items-center hover:text-foreground">
                {landing("ctaStart")}
              </Link>
            </li>
            <li>
              <a href="mailto:privacy@confirma.local" className="inline-flex min-h-11 items-center hover:text-foreground">
                {landing("ctaTalk")}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{landing("footerLegal")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/policies/privacy" className="inline-flex min-h-11 items-center hover:text-foreground">
                {policies("links.privacy")}
              </Link>
            </li>
            <li>
              <Link href="/policies/terms" className="inline-flex min-h-11 items-center hover:text-foreground">
                {policies("links.terms")}
              </Link>
            </li>
            <li>
              <Link href="/policies/refund" className="inline-flex min-h-11 items-center hover:text-foreground">
                {policies("links.refund")}
              </Link>
            </li>
            <li>
              <Link href="/policies/cookies" className="inline-flex min-h-11 items-center hover:text-foreground">
                {policies("links.cookies")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted">{landing("footerCopyright", { year: String(year) })}</p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
