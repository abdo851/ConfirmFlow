import { getTranslations } from "next-intl/server";
import { BlockForm } from "@/components/admin/block-form";
import { Card } from "@/components/ui/card";
import { createBlockAction } from "@/lib/content/actions";
import { contentBlockTypes, type ContentBlockType } from "@/lib/content/schema";

function readType(value: string | undefined): ContentBlockType {
  if (value && contentBlockTypes.includes(value as ContentBlockType)) {
    return value as ContentBlockType;
  }
  return "banner";
}

export async function AdminNewBlock({ type }: { type?: string }) {
  const t = await getTranslations("admin");

  return (
    <Card title={t("newTitle")}>
      <BlockForm
        action={createBlockAction}
        submitLabel={t("create")}
        initial={{ type: readType(type), is_active: true, locale: "both" }}
      />
    </Card>
  );
}
