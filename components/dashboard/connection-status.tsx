import { ConnectionStateItem } from "@/components/connections";
import { Card } from "@/components/ui/card";
import { defaultConnectionStates } from "@/lib/connections";

export function ConnectionStatus() {
  return (
    <Card title="Connections" description="Integration status for your account.">
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {defaultConnectionStates.map((connection) => (
          <ConnectionStateItem key={connection.type} connection={connection} />
        ))}
      </ul>
    </Card>
  );
}
