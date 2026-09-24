import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const items = [
  { key: "store", href: "/onboarding/store" },
  { key: "meta", href: "/onboarding/meta" },
  { key: "product", href: "/onboarding/store" },
  { key: "order", href: "/dashboard/orders" },
] as const;

export async function SetupChecklist() {
  const t = await getTranslations("onboarding");
  const completed = 0;

  return (
    <aside className="h-fit rounded-2xl border border-line bg-surface p-5 shadow-soft sm:p-6 lg:sticky lg:top-6">
      <p className="text-sm font-semibold">{t("checklistTitle")}</p>
      <p className="mt-1 text-sm text-muted">
        {t("checklistProgress", { completed, total: items.length })}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 rtl:bg-gradient-to-l"
          style={{ width: `${(completed / items.length) * 100}%` }}
        />
      </div>
      <ol className="mt-4 space-y-2">
        {items.map((item, index) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-surface-muted"
            >
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-xs font-medium">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 leading-7">{t(`checklist.${item.key}`)}</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {t("checklistPending")}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
