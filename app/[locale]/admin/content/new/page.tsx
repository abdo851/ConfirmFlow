import { redirect } from "@/i18n/navigation";

export default async function NewContentBlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const suffix = query.type ? `?type=${encodeURIComponent(query.type)}` : "";
  redirect({ href: `/dashboard/admin/content/new${suffix}`, locale });
}
