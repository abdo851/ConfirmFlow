import { getLocale, getTranslations } from "next-intl/server";
import { BackButton } from "@/components/ui/back-button";
import { isAppLocale } from "@/lib/i18n/locales";
import { getPolicyOverrides, type PolicyKey } from "@/lib/policies/settings";

export async function PolicyDocument({ policy }: { policy: PolicyKey }) {
  const t = await getTranslations("policies");
  const common = await getTranslations("common");
  const locale = await getLocale();
  const safeLocale = isAppLocale(locale) ? locale : "en";
  const overrides = await getPolicyOverrides();
  const copy = overrides?.[safeLocale]?.[policy];
  const title = copy?.title || t(`${policy}.title`);
  const body = copy?.body || t(`${policy}.body`);

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <BackButton href="/" label={common("back")} />
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="space-y-4 text-sm leading-7 text-muted">
        {body.split(/\n\n+/).map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
