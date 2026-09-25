"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TikTokConnectionPublicState } from "@/lib/integrations/tiktok/types";

export interface TikTokFormCopy {
  pixelCode: string;
  accessToken: string;
  connect: string;
  disconnect: string;
  verify: string;
  connected: string;
  notConnected: string;
  error: string;
  status: {
    unverified: string;
    verified: string;
  };
}

export function TikTokConnectForm({
  copy,
  initialStatus,
}: {
  copy: TikTokFormCopy;
  initialStatus: TikTokConnectionPublicState;
}) {
  const [pixelCode, setPixelCode] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const connected = status.status === "connected";
  const canConnect = pixelCode.trim().length >= 5 && accessToken.trim().length >= 10 && !pending;

  async function refresh() {
    const response = await fetch("/api/integrations/tiktok/status");
    if (response.ok) {
      setStatus((await response.json()) as TikTokConnectionPublicState);
    }
  }

  async function connect() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/tiktok/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pixelCode, accessToken }),
      });
      if (!response.ok) {
        setMessage(copy.error);
        return;
      }
      setAccessToken("");
      setPixelCode("");
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function verify() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/tiktok/verify", { method: "POST" });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(body.message ?? copy.error);
      }
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function disconnect() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/tiktok/disconnect", { method: "POST" });
      if (!response.ok) {
        setMessage(copy.error);
        return;
      }
      setStatus({ provider: "tiktok", status: "not_connected" });
    } finally {
      setPending(false);
    }
  }

  const verificationLabel =
    status.verificationStatus === "verified" ? copy.status.verified : copy.status.unverified;

  return (
    <div className="max-w-xl rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-6">
      <p className="text-sm font-medium text-foreground">
        {connected ? copy.connected : copy.notConnected}
        {connected ? ` · ${verificationLabel}` : ""}
      </p>
      {status.pixelCode ? (
        <p className="mt-2 text-sm text-muted">{status.pixelCode}</p>
      ) : null}
      {status.errorMessage ? (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {status.errorMessage}
        </p>
      ) : null}

      {connected ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={() => void verify()} disabled={pending}>
            {copy.verify}
          </Button>
          <Button type="button" variant="outline" onClick={() => void disconnect()} disabled={pending}>
            {copy.disconnect}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <Input
            label={copy.pixelCode}
            name="pixelCode"
            value={pixelCode}
            onChange={(event) => setPixelCode(event.target.value)}
            autoComplete="off"
          />
          <Input
            label={copy.accessToken}
            name="accessToken"
            type="password"
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            autoComplete="off"
          />
          <Button type="button" className="w-full sm:w-auto" disabled={!canConnect} onClick={() => void connect()}>
            {copy.connect}
          </Button>
        </div>
      )}

      {message ? (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
