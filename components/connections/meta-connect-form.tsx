"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectionStatusBadge } from "./connection-status-badge";
import type { ConnectionStatus } from "@/lib/connections/types";

interface MetaStatusResponse {
  provider: "meta";
  pixelId?: string;
  status: ConnectionStatus;
  errorMessage?: string;
}

export function MetaConnectForm() {
  const t = useTranslations("connections.meta");
  const connections = useTranslations("connections");
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [status, setStatus] = useState<MetaStatusResponse>({
    provider: "meta",
    status: "not_connected",
  });
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const response = await fetch("/api/integrations/meta/status");
      if (response.ok) {
        setStatus((await response.json()) as MetaStatusResponse);
      }
    }

    void loadStatus();
  }, []);

  const canConnect =
    pixelId.trim().length > 0 && accessToken.trim().length > 0 && !isSubmitting;

  return (
    <div className="rounded-md border border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{connections("types.meta.label")}</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {connections("types.meta.description")}
          </p>
          {status.pixelId ? (
            <p className="mt-2 text-sm font-medium">
              {t("pixelMasked", { pixelId: status.pixelId })}
            </p>
          ) : null}
        </div>
        <ConnectionStatusBadge type="meta" status={status.status} />
      </div>

      {status.status !== "connected" ? (
        <div className="mt-4 space-y-4">
          <Input
            label={t("pixelIdLabel")}
            name="pixelId"
            placeholder={t("pixelIdPlaceholder")}
            value={pixelId}
            onChange={(event) => setPixelId(event.target.value)}
            autoComplete="off"
          />
          <Input
            label={t("accessTokenLabel")}
            name="accessToken"
            type="password"
            placeholder={t("accessTokenPlaceholder")}
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            autoComplete="off"
          />
          <Button
            type="button"
            disabled={!canConnect}
            onClick={async () => {
              if (!canConnect) {
                return;
              }

              setIsSubmitting(true);
              setFlashMessage(null);

              const response = await fetch("/api/integrations/meta/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pixelId: pixelId.trim(),
                  accessToken: accessToken.trim(),
                }),
              });

              if (response.ok) {
                setAccessToken("");
                const statusResponse = await fetch("/api/integrations/meta/status");
                if (statusResponse.ok) {
                  setStatus((await statusResponse.json()) as MetaStatusResponse);
                } else {
                  setStatus({ provider: "meta", status: "connected" });
                }
                setFlashMessage(t("connectedSuccess"));
              } else if (response.status === 409) {
                setFlashMessage(t("storeRequired"));
              } else {
                setFlashMessage(t("connectionFailed"));
              }

              setIsSubmitting(false);
            }}
          >
            {isSubmitting ? t("connecting") : t("connect")}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t("configuredNote")}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              setFlashMessage(null);

              const response = await fetch("/api/integrations/meta/disconnect", {
                method: "POST",
              });

              if (response.ok) {
                setStatus({ provider: "meta", status: "not_connected" });
                setPixelId("");
                setAccessToken("");
                setFlashMessage(t("disconnectedSuccess"));
              } else {
                setFlashMessage(t("disconnectFailed"));
              }

              setIsSubmitting(false);
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
