import { getTranslations } from "next-intl/server";
import { BlockForm } from "@/components/admin/block-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createBlockAction } from "@/lib/content/actions";
import type { ContentBlockType } from "@/lib/content/schema";

const ESSENTIAL_TYPES = ["text", "video", "banner"] as const;

function readType(value: string | undefined): ContentBlockType | null {
  if (value && ESSENTIAL_TYPES.includes(value as (typeof ESSENTIAL_TYPES)[number])) {
    return value as ContentBlockType;
  }
  return null;
}

export async function AdminNewBlock({ type }: { type?: string }) {
  const t = await getTranslations("admin");
  const selected = readType(type);

  if (!selected) {
    return (
      <Card title={t("chooseType")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {ESSENTIAL_TYPES.map((item) => (
            <Button key={item} href={`/dashboard/admin/content/new?type=${item}`} variant="outline" className="min-h-11">
              {t(`types.${item}`)}
            </Button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card title={t("newTitle")}>
      <BlockForm
        action={createBlockAction}
        submitLabel={t("publish")}
        initial={{ type: selected, is_active: true, locale: "both" }}
      />
    </Card>
  );
}
