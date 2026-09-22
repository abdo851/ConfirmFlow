import { getTranslations } from "next-intl/server";
import enPolicies from "@/messages/en/policies.json";
import arPolicies from "@/messages/ar/policies.json";
import { PolicyEditor } from "@/components/admin/policy-editor";
import { Card } from "@/components/ui/card";
import { getPolicyOverrides } from "@/lib/policies/settings";

const keys = ["privacy", "terms", "refund", "cookies"] as const;

function catalogFromMessages() {
  return {
    en: Object.fromEntries(
      keys.map((key) => [key, { title: enPolicies[key].title, body: enPolicies[key].body }]),
    ),
    ar: Object.fromEntries(
      keys.map((key) => [key, { title: arPolicies[key].title, body: arPolicies[key].body }]),
    ),
  };
}

export async function AdminPoliciesEditor() {
  const t = await getTranslations("admin");
  const overrides = await getPolicyOverrides();
  const initial = overrides ?? catalogFromMessages();

  return (
    <Card title={t("policiesTitle")} description={t("policiesDescription")}>
      <PolicyEditor initialJson={JSON.stringify(initial, null, 2)} />
    </Card>
  );
}
