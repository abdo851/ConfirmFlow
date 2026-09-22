import { redirect } from "@/i18n/navigation";

export default async function EditContentBlockPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect({ href: `/dashboard/admin/content/${id}`, locale });
}
