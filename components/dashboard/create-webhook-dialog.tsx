"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const TOPICS = [
  "order.created",
  "order.updated",
  "order.cancelled",
  "order.fulfilled",
  "order.paid",
] as const;

function isHttpsUrl(value: string) {
  try {
    return new URL(value.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

export function CreateWebhookDialog({ onCreated }: { onCreated?: (webhookId: string) => void }) {
  const t = useTranslations("dashboard.pages.features.webhooks");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("order.created");
  const [targetUrl, setTargetUrl] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const dialog = dialogRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute("disabled"));

    focusable()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const items = focusable();
      if (!items.length) {
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!TOPICS.includes(topic)) {
      setError(t("invalidTopic"));
      return;
    }
    if (!isHttpsUrl(targetUrl)) {
      setError(t("invalidUrl"));
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch("/api/dashboard/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, targetUrl: targetUrl.trim(), active }),
    });
    setPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (payload?.error === "invalid_url") {
        setError(t("invalidUrl"));
      } else if (payload?.error === "no_store") {
        setError(t("noStore"));
      } else if (payload?.error === "store_required") {
        setError(t("storeRequired"));
      } else {
        setError(t("createFailed"));
      }
      return;
    }
    const payload = (await response.json()) as { webhook?: { webhook_id?: string } };
    setOpen(false);
    setTargetUrl("");
    setActive(true);
    if (payload.webhook?.webhook_id) {
      onCreated?.(payload.webhook.webhook_id);
    }
    router.refresh();
  }

  return (
    <>
      <Button type="button" onClick={() => { setError(null); setOpen(true); }}>
        {t("create")}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="animate-dialog-in w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-large"
          >
            <h2 id={titleId} className="text-lg font-semibold">
              {t("createTitle")}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={submit}>
              <label className="block text-sm font-medium">
                {t("topicLabel")}
                <select
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value as (typeof TOPICS)[number])}
                >
                  {TOPICS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                {t("targetUrlLabel")}
                <input
                  type="url"
                  inputMode="url"
                  dir="ltr"
                  required
                  placeholder={t("targetUrlPlaceholder")}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={targetUrl}
                  onChange={(event) => setTargetUrl(event.target.value)}
                />
              </label>
              <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium">
                {t("activeLabel")}
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--primary)]"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" loading={pending}>{t("createSubmit")}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
