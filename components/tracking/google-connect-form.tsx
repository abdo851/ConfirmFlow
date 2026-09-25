"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GoogleConnectionPublicState } from "@/lib/integrations/google/types";

export interface GoogleFormCopy {
  measurementId: string;
  apiSecret: string;
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

export function GoogleConnectForm({
  copy,
  initialStatus,
}: {
  copy: GoogleFormCopy;
  initialStatus: GoogleConnectionPublicState;
}) {
  const [measurementId, setMeasurementId] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const connected = status.status === "connected";
  const canConnect =
    /^G-[A-Z0-9]+$/.test(measurementId.trim()) && apiSecret.trim().length >= 20 && !pending;

  async function refresh() {
    const response = await fetch("/api/integrations/google/status");
    if (response.ok) {
      setStatus((await response.json()) as GoogleConnectionPublicState);
    }
  }

  async function connect() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/google/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurementId, apiSecret }),
      });
      if (!response.ok) {
        setMessage(copy.error);
        return;
      }
      setApiSecret("");
      setMeasurementId("");
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function verify() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/google/verify", { method: "POST" });
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        setMessage(body.message);
      } else if (!response.ok) {
        setMessage(copy.error);
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
      const response = await fetch("/api/integrations/google/disconnect", { method: "POST" });
      if (!response.ok) {
        setMessage(copy.error);
        return;
      }
      setStatus({ provider: "google", status: "not_connected" });
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
      {status.measurementId || status.conversionId ? (
        <p className="mt-2 text-sm text-muted">{status.measurementId ?? status.conversionId}</p>
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
            label={copy.measurementId}
            name="measurementId"
            value={measurementId}
            onChange={(event) => setMeasurementId(event.target.value)}
            autoComplete="off"
          />
          <Input
            label={copy.apiSecret}
            name="apiSecret"
            type="password"
            value={apiSecret}
            onChange={(event) => setApiSecret(event.target.value)}
            autoComplete="off"
          />
          <Button type="button" className="w-full sm:w-auto" disabled={!canConnect} onClick={() => void connect()}>
            {copy.connect}
          </Button>
        </div>
      )}

      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
