"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import type { AdEventRow } from "@/lib/ads/events/queries";

export function EventsTable({
  rows,
  locale,
  labels,
}: {
  rows: AdEventRow[];
  locale: string;
  labels: {
    time: string;
    order: string;
    event: string;
    platform: string;
    status: string;
    http: string;
    error: string;
    statuses: Record<AdEventRow["status"], string>;
    payload: string;
    response: string;
    close: string;
    empty: string;
  };
}) {
  const [selected, setSelected] = useState<AdEventRow | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-muted dark:border-slate-700">
        {labels.empty}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <table className="min-w-full text-start text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{labels.time}</th>
              <th className="px-4 py-3 font-medium">{labels.order}</th>
              <th className="px-4 py-3 font-medium">{labels.event}</th>
              <th className="px-4 py-3 font-medium">{labels.platform}</th>
              <th className="px-4 py-3 font-medium">{labels.status}</th>
              <th className="px-4 py-3 font-medium">{labels.http}</th>
              <th className="px-4 py-3 font-medium">{labels.error}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={0}
                onClick={() => setSelected(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setSelected(row);
                }}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
              >
                <td className="px-4 py-3 whitespace-nowrap">{new Date(row.sent_at).toLocaleString(locale)}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.order_id ? row.order_id.slice(0, 8) : "—"}</td>
                <td className="px-4 py-3">{row.event_name}</td>
                <td className="px-4 py-3 capitalize">{row.platform}</td>
                <td className="px-4 py-3">
                  <Badge variant={row.status === "sent" ? "success" : row.status === "failed" ? "danger" : "muted"}>
                    {labels.statuses[row.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">{row.http_status ?? "—"}</td>
                <td className="max-w-48 px-4 py-3">
                  {row.error_message ? (
                    <Tooltip label={row.error_message}>
                      <span className="block truncate">{row.error_message}</span>
                    </Tooltip>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <EventModal row={selected} labels={labels} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

function EventModal({
  row,
  labels,
  onClose,
}: {
  row: AdEventRow;
  labels: { payload: string; response: string; close: string };
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="presentation">
      <button type="button" aria-label={labels.close} className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative m-4 max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-medium dark:bg-slate-950"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{row.event_name}</h2>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-sm text-muted">
            {labels.close}
          </button>
        </div>
        <h3 className="mt-4 text-sm font-medium">{labels.payload}</h3>
        <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900">
          {JSON.stringify(row.payload ?? {}, null, 2)}
        </pre>
        <h3 className="mt-4 text-sm font-medium">{labels.response}</h3>
        <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900">
          {JSON.stringify(row.response_summary ?? {}, null, 2)}
        </pre>
      </div>
    </div>,
    document.body,
  );
}
