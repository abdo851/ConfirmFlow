import type { OrderTimelineEvent } from "@/lib/dashboard/order-timeline";

function Icon({ kind }: { kind: OrderTimelineEvent["key"] }) {
  const path =
    kind === "received"
      ? "M4 7h16v10H4zM4 7l8 6 8-6"
      : kind === "confirmed"
        ? "M5 12l5 5L20 7"
        : "M12 3v6M12 21v-6M4.5 7.5l4 2.5M19.5 16.5l-4-2.5";
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OrderTimeline({
  events,
  labels,
}: {
  events: OrderTimelineEvent[];
  labels: Record<OrderTimelineEvent["key"], string>;
}) {
  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.key} className="flex gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-primary dark:bg-indigo-950/50">
            <Icon kind={event.key} />
          </span>
          <div>
            <p className="text-sm font-medium">
              {labels[event.key]}
              {event.status ? ` · ${event.status}` : ""}
            </p>
            <p className="text-sm text-muted">{event.at ? new Date(event.at).toLocaleString() : "—"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
