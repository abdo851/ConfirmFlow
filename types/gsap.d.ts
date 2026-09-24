declare module "gsap" {
  interface GsapTimeline {
    to: (
      target: unknown,
      vars: Record<string, unknown>,
      position?: string | number,
    ) => GsapTimeline;
    fromTo: (
      target: unknown,
      fromVars: Record<string, unknown>,
      toVars: Record<string, unknown>,
      position?: string | number,
    ) => GsapTimeline;
  }

  interface GsapContext {
    revert: () => void;
  }

  interface GsapStatic {
    registerPlugin: (...plugins: unknown[]) => void;
    context: (callback: () => void, scope?: unknown) => GsapContext;
    timeline: (vars?: Record<string, unknown>) => GsapTimeline;
  }

  const gsap: GsapStatic;
  export default gsap;
}

declare module "gsap/ScrollTrigger" {
  export const ScrollTrigger: object;
}
