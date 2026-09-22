import { getTranslations } from "next-intl/server";
import { DashboardSection } from "@/components/dashboard/section";
import { requireDashboardAdmin } from "@/components/dashboard/require-admin";
import { EmptyState } from "@/components/ui/empty-state";
import { createDatabaseClient } from "@/lib/database/client";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireDashboardAdmin(locale);
  const pages = await getTranslations("dashboard.pages");
  let rows: { id: string; role: string }[] = [];
  try {
    const db = createDatabaseClient();
    const { data } = await db.from("profiles").select("id, role");
    rows = (data ?? []).map((row) => ({
      id: String(row.id),
      role: String(row.role ?? "user"),
    }));
  } catch {
    rows = [];
  }

  return (
    <DashboardSection title={pages("adminUsersTitle")} backHref="/dashboard/admin">
      {rows.length === 0 ? (
        <EmptyState title={pages("adminUsersEmpty")} description={pages("adminUsersTitle")} />
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="truncate font-mono">{row.id}</span>
              <span className="font-medium">{row.role}</span>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
