export const CUSTOM_DOMAIN_STATE = "not_connected" as const;

export type ApplicationDomainStatus = {
  applicationUrl: string;
  applicationHost: string;
  customDomain: null;
  customDomainState: typeof CUSTOM_DOMAIN_STATE;
  setupRequired: true;
};

/** Read-only view of the configured application origin. A custom domain is not connectable here. */
export function readApplicationDomainStatus(appUrl: string): ApplicationDomainStatus {
  const applicationUrl = appUrl.replace(/\/$/, "");
  return {
    applicationUrl,
    applicationHost: new URL(applicationUrl).host,
    customDomain: null,
    customDomainState: CUSTOM_DOMAIN_STATE,
    setupRequired: true,
  };
}
