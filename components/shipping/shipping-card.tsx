import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { ShippingProvider } from "@/lib/shipping/data";

export function ShippingCard({
  provider,
  locale,
  description,
  statusLabel,
  connectLabel,
  connectedLabel,
  settingsLabel,
  connected = false,
}: {
  provider: ShippingProvider;
  locale: string;
  description: string;
  statusLabel: string;
  connectLabel: string;
  connectedLabel: string;
  settingsLabel: string;
  connected?: boolean;
}) {
  const name = locale === "ar" ? provider.nameAr : provider.nameEn;

  return (
    <article className="relative flex flex-col rounded-2xl bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-medium dark:bg-slate-950">
      <span
        className={
          provider.integrationType === "direct"
            ? "absolute top-4 start-4 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
            : "absolute top-4 start-4 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }
      >
        {statusLabel}
      </span>
      <button
        type="button"
        aria-label={settingsLabel}
        className="absolute top-4 end-4 inline-flex size-11 items-center justify-center rounded-xl text-muted"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4" />
        </svg>
      </button>
      <Image
        src={provider.logo}
        alt=""
        width={160}
        height={64}
        unoptimized
        className="mx-auto mt-8 h-16 w-auto max-w-[10rem] object-contain"
      />
      <h2 className="mt-4 text-center text-lg font-semibold tracking-tight">{name}</h2>
      <p className="mt-1 truncate text-center text-sm text-muted">{description}</p>
      <div className="mt-5">
        {connected ? (
          <div className="flex min-h-11 items-center justify-between gap-3">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {connectedLabel}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked="true"
              aria-label={connectedLabel}
              className="relative h-7 w-12 rounded-full bg-emerald-500"
            >
              <span className="absolute top-0.5 end-0.5 size-6 rounded-full bg-white" />
            </button>
          </div>
        ) : (
          <Link
            href={`/dashboard/shipping/${provider.slug}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:brightness-95"
          >
            {connectLabel}
          </Link>
        )}
      </div>
    </article>
  );
}
