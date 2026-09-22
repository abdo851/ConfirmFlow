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
    <div className="space-y-6">
      <Card title={t("storesSection")} description={t("connectionsDescription")} interactive>
        <ul className="grid gap-3">
          <ConnectionStateItem connection={storeConnection} />
          {otherConnections.map((connection) => (
            <ConnectionStateItem key={connection.type} connection={connection} />
          ))}
        </ul>
      </Card>
      <Card title={t("metaSection")} description={t("connectionsManageDescription")} interactive>
        <ul className="grid gap-3">
          <ConnectionStateItem connection={metaConnection} />
        </ul>
      </Card>
    </div>
  );
}
