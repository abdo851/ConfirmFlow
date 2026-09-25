"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/lib/animations/use-reveal";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const revealed = useReveal<HTMLDivElement>({ delay, direction: "up" });

  return (
    <div
      ref={revealed.ref}
      data-animate="fade-up"
      data-delay={delay}
      data-visible={revealed.isVisible ? "true" : "false"}
      style={{ animationDelay: `${delay}ms` }}
      className={className}
    >
      {children}
    </div>
  );
}
