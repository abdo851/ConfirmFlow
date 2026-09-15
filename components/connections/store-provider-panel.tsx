import { Suspense } from "react";
import { ShopifyConnectForm } from "./shopify-connect-form";

export function StoreProviderPanel() {
  return (
    <Suspense
      fallback={
        <div className="rounded-md border border-neutral-200 px-4 py-4 text-sm dark:border-neutral-800">
          Loading Shopify connection...
        </div>
      }
    >
      <ShopifyConnectForm />
    </Suspense>
  );
}
