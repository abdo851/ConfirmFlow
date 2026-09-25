"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function StickyCta({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const footer = document.getElementById("site-footer");
    if (!hero || !footer) {
      return;
    }

    let pastHero = false;
    let footerSeen = false;
    const update = () => setVisible(pastHero && !footerSeen);

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        pastHero = !entry?.isIntersecting;
        update();
      },
      { threshold: 0 },
    );
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        footerSeen = Boolean(entry?.isIntersecting);
        update();
      },
      { threshold: 0.08 },
    );

    heroObserver.observe(hero);
    footerObserver.observe(footer);
    return () => {
      heroObserver.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  return (
    <div className={`sticky-cta md:hidden ${visible ? "is-in" : ""}`}>
      <Button href="/signup" size="lg" className="w-full">
        {label}
      </Button>
    </div>
  );
}
