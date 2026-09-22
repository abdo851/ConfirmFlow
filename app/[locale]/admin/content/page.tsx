import { redirect } from "@/i18n/navigation";

export default async function AdminContentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/dashboard/admin/content", locale });
}
