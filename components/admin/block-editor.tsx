"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteBlockAction, reorderBlocksAction, toggleBlockAction } from "@/lib/content/actions";
import type { ContentBlock, ContentBlockType } from "@/lib/content/schema";
import { BlockPreview } from "./block-preview";

const TYPES: ContentBlockType[] = ["banner", "video", "ad", "text"];

export function BlockEditor({ blocks }: { blocks: ContentBlock[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [items, setItems] = useState(blocks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }

    const next = [...items];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) {
      return;
    }
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragId(null);
    setOverId(null);
    void reorderBlocksAction(next.map((item) => item.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <Button key={type} href={`/admin/content/new?type=${type}`} variant="outline">
            {t("addType", { type: t(`types.${type}`) })}
          </Button>
        ))}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted">{t("empty")}</p> : null}
      <ul className="space-y-3">
        {items.map((block) => (
          <li
            key={block.id}
            draggable
            onDragStart={() => setDragId(block.id)}
            onDragOver={(event) => {
              event.preventDefault();
              setOverId(block.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              onDrop(block.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            className={`rounded-2xl border bg-surface p-4 ${
              overId === block.id ? "border-primary ring-2 ring-primary/30" : "border-line"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="cursor-grab text-muted" aria-hidden>
                  ⋮⋮
                </span>
                <Badge variant="muted">{t(`types.${block.type}`)}</Badge>
                <span className="text-sm font-medium">{block.title || t("untitled")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = !block.is_active;
                    setItems((current) =>
                      current.map((item) =>
                        item.id === block.id ? { ...item, is_active: next } : item,
                      ),
                    );
                    void toggleBlockAction(block.id, next);
                  }}
                >
                  {block.is_active ? t("deactivate") : t("activate")}
                </Button>
                <Button href={`/admin/content/${block.id}`} variant="outline">
                  {t("edit")}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setItems((current) => current.filter((item) => item.id !== block.id));
                    void deleteBlockAction(block.id).then(() => router.refresh());
                  }}
                >
                  {t("delete")}
                </Button>
              </div>
            </div>
            <BlockPreview block={block} />
          </li>
        ))}
      </ul>
    </div>
  );
}
