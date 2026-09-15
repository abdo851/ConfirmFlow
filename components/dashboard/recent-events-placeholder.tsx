import { Card } from "@/components/ui/card";

export function RecentEventsPlaceholder() {
  return (
    <Card
      title="Recent conversion events"
      description="Verified conversions sent to Meta will appear here."
    >
      <div className="rounded-md border border-dashed border-neutral-300 px-6 py-10 text-center dark:border-neutral-700">
        <p className="text-sm font-medium">No conversion events yet</p>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Connect your store and Meta to start tracking confirmed orders.
        </p>
      </div>
    </Card>
  );
}
