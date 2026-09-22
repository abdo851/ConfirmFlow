import { redirect } from "@/i18n/navigation";

export default async function AdminPoliciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/dashboard/admin/policies", locale });
}
