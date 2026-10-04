import { getTranslations } from "next-intl/server";
import { DomainManager } from "@/components/admin/domain-manager";
import { DashboardSection } from "@/components/dashboard/section";
import { Card } from "@/components/ui/card";
import { readApplicationDomainStatus } from "@/lib/config/domain-status";
import { getAppBaseUrl } from "@/lib/config/urls";
import { getPlatformDomain } from "@/lib/domain/actions";

export default async function AdminDomainPage() {
  const pages = await getTranslations("dashboard.pages");
  const status = readApplicationDomainStatus(getAppBaseUrl());
  const saved = await getPlatformDomain();

  return (
    <DashboardSection
      title={pages("domainTitle")}
      description={pages("domainDescription")}
      backHref="/dashboard/admin/settings"
    >
      <Card title={pages("applicationDomain")} description={pages("domainScopeNote")}>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-muted">{pages("applicationDomain")}</dt>
            <dd className="mt-1 font-medium">{status.applicationHost}</dd>
          </div>
          <div>
            <dt className="text-muted">{pages("applicationUrl")}</dt>
            <dd className="mt-1 break-all font-medium">{status.applicationUrl}</dd>
          </div>
        </dl>
      </Card>
      <Card title={pages("customDomain")} description={pages("domainInfrastructureNote")}>
        {saved ? null : <p className="mb-4 text-sm text-muted">{pages("domainEmpty")}</p>}
        <DomainManager saved={saved} />
      </Card>
    </DashboardSection>
  );
}
