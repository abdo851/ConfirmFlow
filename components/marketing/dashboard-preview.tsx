"use client";

import { useEffect, useState } from "react";

interface DashboardPreviewProps {
  title: string;
  newLabel: string;
  confirmedLabel: string;
  sentLabel: string;
}

export function DashboardPreview({ title, newLabel, confirmedLabel, sentLabel }: DashboardPreviewProps) {
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(window.scrollY, 300) / 300;
      setShift(-20 * progress);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="dash-slide relative hidden lg:block" aria-hidden>
      <article className="dash-card rounded-2xl border border-line bg-white p-5 shadow-large" style={{ transform: `translateY(${shift}px)` }}>
        <p className="text-sm font-semibold">{title}</p>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex items-center justify-between gap-4">
            <span className="text-muted">{newLabel}</span>
            <span className="text-lg font-bold">100</span>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span className="text-muted">{confirmedLabel}</span>
            <span className="text-lg font-bold text-emerald-600">40</span>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span className="text-muted">{sentLabel}</span>
            <span className="text-lg font-bold text-indigo-600">40</span>
          </li>
        </ul>
        <div className="dash-spark mt-5 flex h-10 items-end gap-1">
          <span style={{ height: "35%" }} />
          <span style={{ height: "55%" }} />
          <span style={{ height: "40%" }} />
          <span style={{ height: "70%" }} />
          <span style={{ height: "48%" }} />
          <span style={{ height: "88%" }} />
          <span style={{ height: "62%" }} />
        </div>
      </article>
    </div>
  );
}
