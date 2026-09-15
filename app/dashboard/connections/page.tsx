import { ConnectionStatus } from "@/components/dashboard";

export default function DashboardConnectionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Manage your store, Meta, and confirmation integrations.
        </p>
      </div>
      <ConnectionStatus />
    </div>
  );
}
