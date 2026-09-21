import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { ConnectionStatusBadge } from "@/components/connections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDefaultConnectionState } from "@/lib/connections";
import { getShopifyConnectionPublicState } from "@/lib/integrations/shopify/session";
import { getWooCommerceConnectionPublicState } from "@/lib/integrations/woocommerce";
import { getYouCanConnectionPublicState } from "@/lib/integrations/youcan/session";
import {
  listConnectedStoreProviders,
  type ConnectedStoreProvider,
} from "./connected-store-providers";
import { ConnectPlaceholderButton } from "./connect-placeholder-button";
import { OnboardingStepNav } from "./step-nav";
import {
  getNextStepHref,
  getOnboardingStep,
  getPreviousStepHref,
  onboardingSteps,
  type OnboardingStepNumber,
} from "./steps";

async function readConnectedStoreProviders(): Promise<ConnectedStoreProvider[]> {
  const [youcan, shopify, woocommerce] = await Promise.all([
    getYouCanConnectionPublicState().catch(() => ({
      provider: "youcan" as const,
      status: "not_connected" as const,
    })),
    getShopifyConnectionPublicState().catch(() => ({
      provider: "shopify" as const,
      status: "not_connected" as const,
    })),
    getWooCommerceConnectionPublicState().catch(() => ({
      connected: false,
    })),
  ]);

  return listConnectedStoreProviders({ youcan, shopify, woocommerce });
}

function providerLabelKey(
  provider: ConnectedStoreProvider["provider"],
): "youcanLabel" | "shopifyLabel" | "woocommerceLabel" {
  if (provider === "youcan") {
    return "youcanLabel";
  }
  if (provider === "shopify") {
    return "shopifyLabel";
  }
  return "woocommerceLabel";
}

interface OnboardingStepShellProps {
  currentStep: OnboardingStepNumber;
  children?: ReactNode;
  connectOverride?: ReactNode;
}

export async function OnboardingStepShell({
  currentStep,
  children,
  connectOverride,
}: OnboardingStepShellProps) {
  const t = await getTranslations("onboarding");
  const connectionsT = await getTranslations("connections");
  const common = await getTranslations("common");
  const step = getOnboardingStep(currentStep);
  const connection = getDefaultConnectionState(step.connectionType);
  const connectedProviders =
    step.connectionType === "store" ? await readConnectedStoreProviders() : [];
  const storeConnected = connectedProviders.length > 0;
  const badgeStatus = storeConnected ? "connected" : connection.status;
  const statusText = storeConnected
    ? connectedProviders
        .map((item) => {
          const provider = connectionsT(providerLabelKey(item.provider));
          return item.target
            ? connectionsT("activeProvider", {
                provider,
                target: item.target,
              })
            : provider;
        })
        .join(" · ")
    : t("noRealIntegration");
  const backHref = getPreviousStepHref(currentStep);
  const nextHref = getNextStepHref(currentStep) ?? "/dashboard";
  const continueLabel =
    currentStep === 3 ? t("continueToDashboard") : common("continue");
  const remainingSteps = onboardingSteps.filter(
    (item) => item.number > currentStep,
  );

  return (
    <div>
      <OnboardingStepNav currentStep={currentStep} />
      <Card
        title={`${t("stepNumber", { number: step.number })} — ${t(`steps.${step.stepKey}.label`)}`}
        description={t(`steps.${step.stepKey}.description`)}
      >
        <div className="flex items-start justify-between gap-4 rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <p className="text-sm font-medium">{t("connectionStatus")}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {statusText}
            </p>
          </div>
          <ConnectionStatusBadge type={connection.type} status={badgeStatus} />
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        <div className="mt-6">
          {connectOverride ?? (
            <ConnectPlaceholderButton
              label={t(`steps.${step.stepKey}.connectLabel`)}
              message={t(`steps.${step.stepKey}.placeholderMessage`)}
            />
          )}
        </div>

        {remainingSteps.length > 0 ? (
          <div className="mt-6 rounded-md border border-dashed border-neutral-300 px-4 py-3 dark:border-neutral-700">
            <p className="text-sm font-medium">{t("whatRemains")}</p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
              {remainingSteps.map((item) => (
                <li key={item.href}>
                  {t("remainingStep", {
                    number: item.number,
                    label: t(`steps.${item.stepKey}.label`),
                  })}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6 rounded-md border border-dashed border-neutral-300 px-4 py-3 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t("finalStepNote")}
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <Link href={backHref} className="text-sm underline">
            {common("back")}
          </Link>
          <Button href={nextHref}>{continueLabel}</Button>
        </div>
      </Card>
    </div>
  );
}
