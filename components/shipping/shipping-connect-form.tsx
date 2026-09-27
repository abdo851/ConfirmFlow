"use client";

import { useState } from "react";

export function ShippingConnectForm({
  apiKeyLabel,
  connectLabel,
  comingSoon,
}: {
  apiKeyLabel: string;
  connectLabel: string;
  comingSoon: string;
}) {
  const [notice, setNotice] = useState("");

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setNotice(comingSoon);
      }}
    >
      <label className="block text-sm font-medium">
        {apiKeyLabel}
        <input
          name="apiKey"
          type="password"
          autoComplete="off"
          required
          className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm"
        />
      </label>
      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground sm:w-auto"
      >
        {connectLabel}
      </button>
      {notice ? (
        <p role="status" className="text-sm font-medium text-primary">
          {notice}
        </p>
      ) : null}
    </form>
  );
}
