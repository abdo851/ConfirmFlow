"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export function AnimatedHero({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <motion.h1
        className="mx-auto max-w-4xl text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl lg:mx-0 lg:text-6xl"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {title}
      </motion.h1>
      <motion.div
        whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </>
  );
}
