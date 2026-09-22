import { getTranslations } from "next-intl/server";
import { ConnectionStateItem } from "@/components/connections";
import { Card } from "@/components/ui/card";
import { defaultConnectionStates } from "@/lib/connections";
import {
  getMetaConnectionState,
  getStoreConnectionState,
} from "@/lib/connections/server";

export async function ConnectionStatus() {
  const t = await getTranslations("dashboard");
  const [storeConnection, metaConnection] = await Promise.all([
    getStoreConnectionState(),
    getMetaConnectionState(),
  ]);
  const otherConnections = defaultConnectionStates.filter(
    (connection) => connection.type === "confirmation",
  );

  return (
    <Card title={t("connectionsTitle")} description={t("connectionsDescription")} interactive>
      <ul className="grid gap-3">
        <ConnectionStateItem connection={storeConnection} />
        <ConnectionStateItem connection={metaConnection} />
        {otherConnections.map((connection) => (
          <ConnectionStateItem key={connection.type} connection={connection} />
        ))}
      </ul>
    </Card>
  );
}
