import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { GsapScrollMachineScene } from "@/components/prototypes/gsap-scroll-machine-scene";
import { isAppLocale } from "@/lib/i18n/locales";

export default async function GsapTestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <GsapScrollMachineScene locale={locale} />;
}
