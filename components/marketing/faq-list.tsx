"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqList({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-8 grid gap-3">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <article key={item.question} className="landing-card rounded-2xl border border-line bg-surface px-5">
            <button
              type="button"
              className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-start text-base font-semibold"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : index)}
            >
              {item.question}
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className={`faq-chevron size-6 shrink-0 text-muted ${open ? "is-open" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className={`accordion-panel ${open ? "is-open" : ""}`}>
              <div>
                <p className="pb-4 text-sm leading-6 text-muted sm:text-base">{item.answer}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
