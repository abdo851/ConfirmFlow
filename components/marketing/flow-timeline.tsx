"use client";

import { useReveal } from "@/lib/animations/use-reveal";

export function FlowTimeline({ steps }: { steps: string[] }) {
  const { ref, isVisible } = useReveal<HTMLOListElement>();

  return (
    <ol ref={ref} className="flow-timeline" data-visible={isVisible ? "true" : "false"}>
      <span aria-hidden className="flow-line" />
      {steps.map((label, index) => (
        <li key={`${label}-${index}`} className="flow-step">
          <span className="flow-dot" style={{ animationDelay: `${index * 150}ms` }}>{index + 1}</span>
          <span className="flow-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}
