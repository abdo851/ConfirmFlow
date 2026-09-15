import {
  ConnectionStatus,
  RecentEventsPlaceholder,
  SetupProgress,
} from "@/components/dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Monitor setup progress and connection status for your Confirma account.
        </p>
      </div>
      <SetupProgress />
      <div className="grid gap-8 lg:grid-cols-2">
        <ConnectionStatus />
        <RecentEventsPlaceholder />
      </div>
    </div>
  );
}
