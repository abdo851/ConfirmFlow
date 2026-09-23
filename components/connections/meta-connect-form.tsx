"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectionStatusBadge } from "./connection-status-badge";
import type { ConnectionStatus } from "@/lib/connections/types";
import type { MetaVerificationStatus } from "@/lib/integrations/meta/verification/types";

interface MetaStatusResponse {
  provider: "meta";
  pixelId?: string;
  status: ConnectionStatus;
  verificationStatus?: MetaVerificationStatus;
  verifiedAt?: string;
  errorMessage?: string;
}

function verificationMessageKey(
  status: MetaVerificationStatus | undefined,
): string | null {
  switch (status) {
    case "verified":
      return "verificationVerified";
    case "credentials_valid":
      return "verificationCredentialsValid";
    case "identifier_not_verified":
      return "verificationIdentifierNotVerified";
    case "failed":
      return "verificationFailed";
    case "unverified":
      return "verificationUnverified";
    default:
      return null;
  }
}

export function MetaConnectForm() {
  const t = useTranslations("connections.meta");
  const pages = useTranslations("dashboard.pages.features.meta");
  const connections = useTranslations("connections");
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [status, setStatus] = useState<MetaStatusResponse>({
    provider: "meta",
    status: "not_connected",
  });
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshStatus() {
    const response = await fetch("/api/integrations/meta/status");
    if (response.ok) {
      setStatus((await response.json()) as MetaStatusResponse);
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  const canConnect =
    /^\d+$/.test(pixelId.trim()) && accessToken.trim().length > 0 && !isSubmitting;
  const pixelInvalid = pixelId.trim().length > 0 && !/^\d+$/.test(pixelId.trim());

  const verificationKey = verificationMessageKey(status.verificationStatus);
  const showVerifyButton =
    status.status === "connected" &&
    status.verificationStatus !== "verified" &&
    !isSubmitting;

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
          {pixelInvalid ? (
            <p className="text-sm text-rose-700" role="alert">
              {pages("pixelInvalid")}
            </p>
          ) : null}
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
                await refreshStatus();
                setFlashMessage(`${t("connectedSuccess")} ${pages("nextSteps")}`);
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
          {verificationKey ? (
            <p
              className={`text-sm ${
                status.verificationStatus === "verified"
                  ? "text-green-700 dark:text-green-400"
                  : status.verificationStatus === "failed"
                    ? "text-red-700 dark:text-red-400"
                    : "text-amber-700 dark:text-amber-400"
              }`}
              role="status"
            >
              {t(verificationKey)}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {showVerifyButton ? (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  setFlashMessage(null);

                  const response = await fetch("/api/integrations/meta/verify", {
                    method: "POST",
                  });

                  if (response.ok) {
                    await refreshStatus();
                  } else {
                    setFlashMessage(t("verificationFailed"));
                  }

                  setIsSubmitting(false);
                }}
              >
                {isSubmitting ? t("verifying") : t("verify")}
              </Button>
            ) : null}
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
