import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const connections = [
  {
    name: "Store",
    description: "Your e-commerce platform (Shopify, WooCommerce, or YouCan).",
    status: "Not connected",
  },
  {
    name: "Meta",
    description: "Meta Pixel and Conversions API for verified purchase events.",
    status: "Not connected",
  },
  {
    name: "Confirmation",
    description: "How orders are confirmed before conversions are sent.",
    status: "Not configured",
  },
] as const;

export function ConnectionStatus() {
  return (
    <Card title="Connections" description="Integration status for your account.">
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {connections.map((connection) => (
          <li
            key={connection.name}
            className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div>
              <p className="font-medium">{connection.name}</p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {connection.description}
              </p>
            </div>
            <Badge variant="warning">{connection.status}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
