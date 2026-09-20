"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectionStatusBadge } from "./connection-status-badge";
import { YOUCAN_PROVIDER_LABEL } from "@/integrations/stores/youcan/constants";
import type { ConnectionStatus } from "@/lib/connections/types";

interface YouCanStatusResponse {
  provider: "youcan";
  storeSlug?: string;
  status: ConnectionStatus;
  errorMessage?: string;
}

const ERROR_REASONS = [
  "invalid_store",
  "invalid_state",
  "access_denied",
  "token_exchange_failed",
  "configuration",
  "persistence_failed",
  "webhook_registration_failed",
  "store_slug_mismatch",
] as const;

export function YouCanConnectForm() {
  const searchParams = useSearchParams();
  const t = useTranslations("connections.youcan");
  const connections = useTranslations("connections");
  const errors = useTranslations("errors.youcan");
  const [storeSlug, setStoreSlug] = useState("");
  const [status, setStatus] = useState<YouCanStatusResponse>({
    provider: "youcan",
    status: "not_connected",
  });
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const response = await fetch("/api/integrations/youcan/status");
      if (response.ok) {
        setStatus((await response.json()) as YouCanStatusResponse);
      }
    }

    void loadStatus();

    const result = searchParams.get("youcan");
    const reason = searchParams.get("reason");

    if (result === "connected") {
      setFlashMessage(t("connectedSuccess"));
    } else if (result === "error") {
      setFlashMessage(
        reason &&
          ERROR_REASONS.includes(reason as (typeof ERROR_REASONS)[number])
          ? errors(reason as (typeof ERROR_REASONS)[number])
          : t("connectionFailed"),
      );
    }
  }, [searchParams, t, errors]);

  const connectHref = storeSlug.trim()
    ? `/api/integrations/youcan/connect?store=${encodeURIComponent(storeSlug.trim())}`
    : undefined;

  return (
    <div className="rounded-md border border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{connections("storeProvider")}</p>
          <p className="mt-1 text-base font-semibold">{YOUCAN_PROVIDER_LABEL}</p>
          {status.storeSlug ? (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {status.storeSlug}
            </p>
          ) : null}
        </div>
        <ConnectionStatusBadge type="store" status={status.status} />
      </div>

      {status.status !== "connected" ? (
        <div className="mt-4 space-y-4">
          <Input
            label={t("storeSlugLabel")}
            name="store"
            placeholder={t("storeSlugPlaceholder")}
            value={storeSlug}
            onChange={(event) => setStoreSlug(event.target.value)}
          />
          {connectHref ? (
            <Button href={connectHref}>{t("connect")}</Button>
          ) : (
            <Button type="button" disabled>
              {t("connect")}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const response = await fetch("/api/integrations/youcan/disconnect", {
                method: "POST",
              });
              if (response.ok) {
                setStatus({ provider: "youcan", status: "not_connected" });
                setFlashMessage(t("disconnectedSuccess"));
              } else {
                setFlashMessage(t("disconnectFailed"));
              }
            }}
          >
            {t("disconnect")}
          </Button>
        </div>
      )}

      {flashMessage ? (
        <p
          className={`mt-4 text-sm ${
            status.status === "connected"
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"
          }`}
          role="status"
        >
          {flashMessage}
        </p>
      ) : null}

      {status.errorMessage ? (
        <p className="mt-4 text-sm text-red-700 dark:text-red-400" role="alert">
          {status.errorMessage}
        </p>
      ) : null}
    </div>
  );
}
