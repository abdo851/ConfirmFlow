import { SiteHeader } from "@/components/layout/site-header";
import { LandingFooter } from "@/components/marketing/landing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
