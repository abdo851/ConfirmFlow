"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/lib/animations/use-reveal";

export function CinematicReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const revealed = useReveal<HTMLDivElement>({ delay });

  return (
    <div
      ref={revealed.ref}
      data-animate="cinematic"
      data-visible={revealed.isVisible ? "true" : "false"}
      style={{ animationDelay: `${delay}ms` }}
      className={className}
    >
      {children}
    </div>
  );
}
