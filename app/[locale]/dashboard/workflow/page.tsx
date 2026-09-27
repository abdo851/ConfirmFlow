import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/ui/back-button";

const steps = [
  { key: "store", status: "ready" },
  { key: "order", status: "ready" },
  { key: "confirm", status: "ready" },
  { key: "ads", status: "ready" },
  { key: "shipping", status: "soon" },
] as const;

function StepIcon({ name }: { name: (typeof steps)[number]["key"] }) {
  const common = "size-6";
  if (name === "store") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 9h16l-1 11H5L4 9z" />
        <path d="M8 9V6a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (name === "order") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 4h10v16H7z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }
  if (name === "confirm") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12.2 2.3 2.3 4.7-5" />
      </svg>
    );
  }
  if (name === "ads") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="7" cy="12" r="2" />
        <circle cx="17" cy="7" r="2" />
        <circle cx="17" cy="17" r="2" />
        <path d="M9 11.2 15 8.2M9 12.8l6 3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8h11v7H3z" />
      <path d="M14 11h4l3 3v1h-7" />
      <circle cx="7" cy="17.5" r="1.4" />
      <circle cx="17" cy="17.5" r="1.4" />
    </svg>
  );
}

export default async function WorkflowPage() {
  const t = await getTranslations("dashboard.workflow");
  const common = await getTranslations("common");

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label={common("back")} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {t("badge")}
        </span>
      </div>
      <ol className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {steps.map((step, index) => (
          <li key={step.key} className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <article className="flex min-h-28 flex-1 flex-col items-center justify-center rounded-2xl border border-line bg-white p-4 text-center shadow-soft transition duration-200 hover:-translate-y-0.5 dark:bg-slate-950">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200">
                <StepIcon name={step.key} />
              </span>
              <h2 className="mt-3 text-sm font-semibold">{t(step.key)}</h2>
              <p className={`mt-1 text-xs font-medium ${step.status === "ready" ? "text-emerald-700" : "text-amber-700"}`}>
                {step.status === "ready" ? t("ready") : t("soon")}
              </p>
            </article>
            {index < steps.length - 1 ? (
              <span aria-hidden className="relative mx-auto flex h-8 w-px items-center justify-center lg:h-px lg:w-8">
                <span className="absolute inset-0 bg-indigo-200 dark:bg-indigo-800" />
                <span className="relative size-2 animate-pulse rounded-full bg-indigo-500" />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
