import { ConnectionStateItem } from "@/components/connections";
import { Card } from "@/components/ui/card";
import { defaultConnectionStates } from "@/lib/connections";
import { getStoreConnectionState } from "@/lib/connections/server";

export async function ConnectionStatus() {
  const storeConnection = await getStoreConnectionState();
  const otherConnections = defaultConnectionStates.filter(
    (connection) => connection.type !== "store",
  );

  return (
    <Card title="Connections" description="Integration status for your account.">
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        <ConnectionStateItem connection={storeConnection} />
        {otherConnections.map((connection) => (
          <ConnectionStateItem key={connection.type} connection={connection} />
        ))}
      </ul>
    </Card>
  );
}
