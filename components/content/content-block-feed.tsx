"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BlockPreview } from "@/components/admin/block-preview";
import type { ContentBlock } from "@/lib/content/schema";

const STORAGE_KEY = "confirma-dismissed-blocks";

export function ContentBlockFeed({ blocks }: { blocks: ContentBlock[] }) {
  const t = useTranslations("dashboard");
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setHidden(parsed.filter((item) => typeof item === "string"));
      }
    } catch {
      setHidden([]);
    }
  }, []);

  if (blocks.length === 0) {
    return null;
  }

  const visible = blocks.filter((block) => !hidden.includes(block.id));
  if (visible.length === 0) {
    return null;
  }

  function dismiss(id: string) {
    const next = [...hidden, id];
    setHidden(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <div className="space-y-4">
      {visible.map((block) => (
        <div key={block.id} className="relative">
          <button
            type="button"
            aria-label={t("content.close")}
            className="absolute end-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-surface text-sm font-semibold shadow-soft"
            onClick={() => dismiss(block.id)}
          >
            ×
          </button>
          <BlockPreview block={block} />
        </div>
      ))}
    </div>
  );
}
