import { requireDashboardAdmin } from "@/components/dashboard/require-admin";

export default async function DashboardAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireDashboardAdmin(locale);
  return children;
}
