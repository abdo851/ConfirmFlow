import { getTranslations } from "next-intl/server";
import { BlockEditor } from "@/components/admin/block-editor";
import { listBlocks } from "@/lib/content/blocks";

export async function AdminBlockList() {
  const t = await getTranslations("admin");
  const blocks = await listBlocks();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t("listTitle")}</h2>
      <p className="text-sm text-muted">{t("listDescription")}</p>
      <BlockEditor blocks={blocks} />
    </section>
  );
}
