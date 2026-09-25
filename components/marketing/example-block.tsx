"use client";

import { CountUp } from "@/components/marketing/count-up";
import { useReveal } from "@/lib/animations/use-reveal";

interface ExampleBlockProps {
  label: string;
  title: string;
  orders: string;
  confirmed: string;
  purchases: string;
  note: string;
}

export function ExampleBlock({ label, title, orders, confirmed, purchases, note }: ExampleBlockProps) {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="example-card mx-auto mt-10 max-w-4xl rounded-2xl border border-line bg-white p-5 text-center shadow-soft sm:p-8"
      data-visible={isVisible ? "true" : "false"}
    >
      <p className="text-xs font-semibold tracking-[0.14em] text-amber-600 uppercase">{label}</p>
      <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
      <ol className="example-steps mt-8">
        <li className="example-step">
          <span className="example-icon bg-indigo-50 text-indigo-700" aria-hidden>
            <BoxIcon />
          </span>
          <p className="text-3xl font-bold text-indigo-600 sm:text-4xl">
            <CountUp value={100} />
          </p>
          <p className="text-sm font-medium">{orders}</p>
        </li>
        <li className="example-arrow" aria-hidden>
          <ArrowIcon />
        </li>
        <li className="example-step">
          <span className="example-icon bg-emerald-50 text-emerald-600" aria-hidden>
            <CheckIcon />
          </span>
          <p className="text-3xl font-bold text-teal-600 sm:text-4xl">
            <CountUp value={40} />
          </p>
          <p className="text-sm font-medium">{confirmed}</p>
        </li>
        <li className="example-arrow" aria-hidden>
          <ArrowIcon />
        </li>
        <li className="example-step">
          <span className="example-icon bg-emerald-50" aria-hidden>
            <span className="brand-mark" style={{ backgroundImage: "url(/brands/meta.svg)" }} />
          </span>
          <p className="text-3xl font-bold text-emerald-600 sm:text-4xl">
            <CountUp value={40} />
          </p>
          <p className="text-sm font-medium">{purchases}</p>
        </li>
      </ol>
      <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-muted sm:text-base">{note}</p>
    </section>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h16v10H4zM8 8V6h8v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="example-arrow-icon size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
