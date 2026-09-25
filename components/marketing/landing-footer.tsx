import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { CinematicReveal } from "@/components/marketing/cinematic-reveal";
import { Link } from "@/i18n/navigation";

export async function LandingFooter() {
  const landing = await getTranslations("landing");
  const nav = await getTranslations("navigation");
  const brand = await getTranslations("common");
  const policies = await getTranslations("policies");
  const year = new Date().getFullYear();

  return (
    <footer id="site-footer" className="section-premium wash-plain mt-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 text-center md:grid-cols-2 md:text-start lg:grid-cols-4">
        <CinematicReveal delay={0}>
        <div>
          <p className="text-base font-semibold">{landing("footerCompany")}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">{landing("footer")}</p>
          <Link href="/" className="footer-link mt-3 inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground">
            {brand("home")}
          </Link>
        </div>
        </CinematicReveal>
        <CinematicReveal delay={80}>
        <div>
          <p className="text-sm font-semibold">{landing("footerFeatures")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted max-md:flex max-md:flex-col max-md:items-center">
            <li>
              <a href="#features" className="footer-link inline-flex min-h-11 items-center hover:text-foreground">
                {landing("stepsTitle")}
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="footer-link inline-flex min-h-11 items-center hover:text-foreground">
                {landing("howItWorks")}
              </a>
            </li>
          </ul>
        </div>
        </CinematicReveal>
        <CinematicReveal delay={160}>
        <div>
          <p className="text-sm font-semibold">{landing("footerSupport")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted max-md:flex max-md:flex-col max-md:items-center">
            <li>
              <Link href="/login" className="footer-link inline-flex min-h-11 items-center hover:text-foreground">
                {nav("signIn")}
              </Link>
            </li>
            <li>
              <Link href="/signup" className="footer-link inline-flex min-h-11 items-center hover:text-foreground">
                {landing("ctaStart")}
              </Link>
            </li>
            <li>
              <a href="mailto:privacy@confirma.local" className="footer-link inline-flex min-h-11 items-center hover:text-foreground">
                {landing("ctaTalk")}
              </a>
            </li>
          </ul>
        </div>
        </CinematicReveal>
        <CinematicReveal delay={240}>
        <div>
          <p className="text-sm font-semibold">{landing("footerLegal")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted max-md:flex max-md:flex-col max-md:items-center">
            <li>
              <Link href="/policies/privacy" className="footer-link inline-flex min-h-11 items-center hover:text-foreground">
                {policies("links.privacy")}
              </Link>
            </li>
            <li>
              <Link href="/policies/terms" className="footer-link inline-flex min-h-11 items-center hover:text-foreground">
                {policies("links.terms")}
              </Link>
            </li>
            <li>
              <Link href="/policies/refund" className="footer-link inline-flex min-h-11 items-center hover:text-foreground">
                {policies("links.refund")}
              </Link>
            </li>
            <li>
              <Link href="/policies/cookies" className="footer-link inline-flex min-h-11 items-center hover:text-foreground">
                {policies("links.cookies")}
              </Link>
            </li>
          </ul>
        </div>
        </CinematicReveal>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-center sm:flex-row sm:items-center sm:px-6 sm:text-start lg:px-8">
          <p className="text-sm text-muted">{landing("footerCopyright", { year: String(year) })}</p>
          <div className="w-full sm:w-auto [&_label]:flex [&_label]:w-full [&_select]:w-full sm:[&_label]:inline-flex sm:[&_select]:w-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
