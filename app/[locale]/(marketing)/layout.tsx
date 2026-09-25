import { SiteHeader } from "@/components/layout/site-header";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader signedIn={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
