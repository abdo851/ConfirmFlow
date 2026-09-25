"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/lib/animations/use-reveal";

export function SetupTrack({ children }: { children: ReactNode }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="relative" data-visible={isVisible ? "true" : "false"}>
      {children}
    </div>
  );
}
