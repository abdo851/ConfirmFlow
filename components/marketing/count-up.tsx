"use client";

import { useEffect, useState } from "react";
import { useCountUp } from "@/lib/animations/use-count-up";
import { useReveal } from "@/lib/animations/use-reveal";

interface CountUpProps {
  value: number;
  suffix?: string;
  delay?: number;
  className?: string;
}

export function CountUp({ value, suffix = "", delay = 0, className = "" }: CountUpProps) {
  const { ref, isVisible } = useReveal<HTMLSpanElement>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const timer = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay, isVisible]);

  const current = useCountUp(value, ready);

  return (
    <span
      ref={ref}
      className={`animate-count ${className}`.trim()}
      data-animate="fade-up"
      data-visible={ready ? "true" : "false"}
    >
      {current}
      {suffix}
    </span>
  );
}
