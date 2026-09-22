import { DashboardShell } from "@/components/layout/dashboard-shell";
import { readSidebarIsAdmin } from "@/components/dashboard/read-sidebar-role";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await readSidebarIsAdmin();
  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
