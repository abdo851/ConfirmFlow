import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BlockForm } from "@/components/admin/block-form";
import { Card } from "@/components/ui/card";
import { updateBlockAction } from "@/lib/content/actions";
import { getBlock } from "@/lib/content/blocks";

export async function AdminEditBlock({ id }: { id: string }) {
  const block = await getBlock(id);
  if (!block) {
    notFound();
  }

  const t = await getTranslations("admin");

  return (
    <Card title={t("editTitle")}>
      <BlockForm
        action={updateBlockAction.bind(null, block.id)}
        submitLabel={t("save")}
        initial={block}
      />
    </Card>
  );
}
