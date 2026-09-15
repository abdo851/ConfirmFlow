import { ConnectionStatusBadge } from "./connection-status-badge";
import type { ConnectionState } from "@/lib/connections";

interface ConnectionStateItemProps {
  connection: ConnectionState;
}

export function ConnectionStateItem({ connection }: ConnectionStateItemProps) {
  return (
    <li className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="font-medium">{connection.label}</p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {connection.description}
        </p>
        {connection.metadata?.errorMessage ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {connection.metadata.errorMessage}
          </p>
        ) : null}
      </div>
      <ConnectionStatusBadge
        type={connection.type}
        status={connection.status}
      />
    </li>
  );
}
