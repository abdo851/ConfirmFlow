"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface GsapScrollMachineSceneProps {
  locale: string;
}

const PARTS = {
  wheelLeft: { assemble: { x: 0, y: 0 }, explode: { x: -140, y: 48 } },
  wheelRight: { assemble: { x: 0, y: 0 }, explode: { x: 140, y: 48 } },
  engine: { assemble: { x: 0, y: 0 }, explode: { x: 0, y: -95 } },
  gear: { assemble: { x: 0, y: 0 }, explode: { x: -95, y: -70 } },
  pistonLeft: { assemble: { x: 0, y: 0 }, explode: { x: -110, y: 20 } },
  pistonRight: { assemble: { x: 0, y: 0 }, explode: { x: 110, y: 20 } },
  exhaust: { assemble: { x: 0, y: 0 }, explode: { x: 85, y: -55 } },
  panel: { assemble: { x: 0, y: 0 }, explode: { x: 0, y: 72 } },
} as const;

export function GsapScrollMachineScene({ locale }: GsapScrollMachineSceneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const finalTextRef = useRef<HTMLParagraphElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const partRefs = useRef<Record<keyof typeof PARTS, HTMLDivElement | null>>({
    wheelLeft: null,
    wheelRight: null,
    engine: null,
    gear: null,
    pistonLeft: null,
    pistonRight: null,
    exhaust: null,
    panel: null,
  });

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const pinEl = pinRef.current;
    if (!scrollEl || !pinEl) {
      return;
    }

    const ctx = gsap.context(() => {
      const partEntries = Object.entries(partRefs.current) as Array<
        [keyof typeof PARTS, HTMLDivElement | null]
      >;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollEl,
          start: "top top",
          end: "+=450%",
          pin: pinEl,
          scrub: 1.2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        labelRef.current,
        { opacity: 1 },
        { opacity: 0, duration: 0.6 },
        0.1,
      );

      partEntries.forEach(([key, element]) => {
        if (!element) {
          return;
        }

        const { explode } = PARTS[key];
        tl.fromTo(
          element,
          { x: 0, y: 0, rotation: 0, opacity: 1 },
          {
            x: explode.x,
            y: explode.y,
            rotation: key.includes("wheel") ? 18 : key === "gear" ? -35 : 8,
            duration: 1.2,
            ease: "power2.inOut",
          },
          0.15,
        );
      });

      tl.to({}, { duration: 0.8 });

      partEntries.forEach(([, element]) => {
        if (!element) {
          return;
        }

        tl.to(
          element,
          {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 1.2,
            ease: "power2.inOut",
          },
          2.15,
        );
      });

      tl.fromTo(
        finalTextRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        3.1,
      );
    }, scrollRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const isArabic = locale === "ar";

  return (
    <div
      ref={scrollRef}
      className="relative bg-[#07080d] text-neutral-100"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div
        ref={pinRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.14),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,rgba(0,0,0,0.35))]"
        />

        <p
          ref={labelRef}
          className="mb-10 text-center text-xs font-medium uppercase tracking-[0.35em] text-neutral-400"
        >
          GSAP ScrollTrigger Prototype
        </p>

        <div className="relative h-[320px] w-full max-w-3xl sm:h-[380px]">
          <div className="absolute left-1/2 top-1/2 h-[108px] w-[min(92%,520px)] -translate-x-1/2 -translate-y-[38%] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#1a1d27_0%,#10131b_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-8 top-5 h-2 rounded-full bg-white/10" />
            <div className="absolute bottom-5 left-8 right-8 h-px bg-white/5" />
          </div>

          <div
            ref={(node) => {
              partRefs.current.panel = node;
            }}
            className="absolute left-1/2 top-[calc(50%-12px)] h-[54px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-indigo-400/20 bg-[linear-gradient(180deg,#22283a_0%,#171b28_100%)]"
          />

          <div
            ref={(node) => {
              partRefs.current.engine = node;
            }}
            className="absolute left-1/2 top-[calc(50%-18px)] flex h-[72px] w-[96px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border border-white/15 bg-[#252a38]"
          >
            <div className="mb-2 h-2 w-10 rounded-full bg-indigo-300/70" />
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-2 w-2 rounded-sm bg-neutral-500/80"
                />
              ))}
            </div>
          </div>

          <div
            ref={(node) => {
              partRefs.current.gear = node;
            }}
            className="absolute left-1/2 top-[calc(50%-92px)] h-14 w-14 -translate-x-1/2 rounded-full border border-white/20 bg-[#1d2230]"
          >
            <svg viewBox="0 0 64 64" className="h-full w-full text-indigo-300/80">
              <circle cx="32" cy="32" r="10" fill="currentColor" opacity="0.35" />
              {Array.from({ length: 8 }).map((_, index) => {
                const angle = (index * 45 * Math.PI) / 180;
                const x = 32 + Math.cos(angle) * 22;
                const y = 32 + Math.sin(angle) * 22;
                return (
                  <rect
                    key={index}
                    x={x - 4}
                    y={y - 4}
                    width="8"
                    height="8"
                    rx="1"
                    fill="currentColor"
                  />
                );
              })}
            </svg>
          </div>

          <div
            ref={(node) => {
              partRefs.current.pistonLeft = node;
            }}
            className="absolute left-[calc(50%-118px)] top-[calc(50%-8px)] h-10 w-10 -translate-x-1/2 rounded-lg border border-white/15 bg-[#202636]"
          >
            <div className="mx-auto mt-2 h-6 w-2 rounded-full bg-neutral-400/70" />
          </div>

          <div
            ref={(node) => {
              partRefs.current.pistonRight = node;
            }}
            className="absolute left-[calc(50%+118px)] top-[calc(50%-8px)] h-10 w-10 -translate-x-1/2 rounded-lg border border-white/15 bg-[#202636]"
          >
            <div className="mx-auto mt-2 h-6 w-2 rounded-full bg-neutral-400/70" />
          </div>

          <div
            ref={(node) => {
              partRefs.current.exhaust = node;
            }}
            className="absolute left-[calc(50%+88px)] top-[calc(50%-54px)] h-8 w-16 -translate-x-1/2 rounded-full border border-white/10 bg-[#181c27]"
          />

          <div
            ref={(node) => {
              partRefs.current.wheelLeft = node;
            }}
            className="absolute left-[calc(50%-150px)] top-[calc(50%+72px)] h-[72px] w-[72px] -translate-x-1/2 rounded-full border-[3px] border-neutral-500/70 bg-[#12151d]"
          >
            <div className="absolute inset-3 rounded-full border border-white/10" />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300/80" />
          </div>

          <div
            ref={(node) => {
              partRefs.current.wheelRight = node;
            }}
            className="absolute left-[calc(50%+150px)] top-[calc(50%+72px)] h-[72px] w-[72px] -translate-x-1/2 rounded-full border-[3px] border-neutral-500/70 bg-[#12151d]"
          >
            <div className="absolute inset-3 rounded-full border border-white/10" />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300/80" />
          </div>
        </div>

        <p
          ref={finalTextRef}
          className="mt-12 max-w-xl text-center text-2xl font-medium tracking-tight text-white opacity-0 sm:text-3xl"
        >
          Built to move with every confirmed order.
        </p>
      </div>

      <div className="h-[45vh]" aria-hidden />
    </div>
  );
}
