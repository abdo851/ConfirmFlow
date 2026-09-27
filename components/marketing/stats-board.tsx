"use client";

import { useEffect, useRef, useState } from "react";

function CountUp({
  active,
  target,
  suffix,
}: {
  active: boolean;
  target: number;
  suffix: string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }
    const start = performance.now();
    const duration = 1200;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return (
    <p className="text-3xl font-bold tracking-tight text-indigo-700 sm:text-4xl dark:text-indigo-200">
      {value}
      {suffix}
    </p>
  );
}

export function StatsBoard({
  items,
}: {
  items: { target: number; suffix: string; label: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-line bg-surface p-5 text-center shadow-soft transition duration-200 hover:-translate-y-0.5"
        >
          <CountUp active={active} target={item.target} suffix={item.suffix} />
          <p className="mt-2 text-sm leading-6 text-muted">{item.label}</p>
        </article>
      ))}
    </div>
  );
}
