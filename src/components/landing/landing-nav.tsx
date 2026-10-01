"use client";

import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type MouseEvent } from "react";
import { tabSpring } from "@/components/tab-nav";
import { cn } from "@/lib/utils";

const sections = [
  { id: "features", label: "Features" },
  { id: "self-host", label: "Self-host" },
  { id: "privacy", label: "Privacy" },
] as const;

type SectionId = (typeof sections)[number]["id"];

const readingLine = 0.35;

const itemClass =
  "relative rounded px-3 py-1.5 text-sm font-medium transition-tesla lg:px-4";

function sectionInView(): SectionId | null {
  const line = window.innerHeight * readingLine;
  for (const { id } of sections) {
    const box = document.getElementById(id)?.getBoundingClientRect();
    if (box && box.top <= line && box.bottom > line) return id;
  }
  return null;
}

export function LandingNav({ docsUrl }: { docsUrl: string }) {
  const [active, setActive] = useState<SectionId | null>(null);
  const systemReduced = useReducedMotion();

  useEffect(() => {
    let frame = 0;
    const update = () => setActive(sectionInView());
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  function jump(event: MouseEvent<HTMLAnchorElement>, id: SectionId) {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduced =
      systemReduced || document.documentElement.dataset.motion === "reduced";
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
    history.replaceState(null, "", `#${id}`);
    setActive(id);
  }

  return (
    <MotionConfig reducedMotion="user">
      <nav aria-label="Page" className="hidden items-center gap-1 md:flex">
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(event) => jump(event, id)}
            aria-current={active === id ? "location" : undefined}
            className={cn(
              itemClass,
              active === id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active === id && (
              <motion.span
                layoutId="landing-nav-highlight"
                transition={tabSpring}
                className="absolute inset-0 rounded bg-accent"
              />
            )}
            <span className="relative">{label}</span>
          </a>
        ))}
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            itemClass,
            "text-muted-foreground hover:text-foreground",
          )}
        >
          Docs
        </a>
      </nav>
    </MotionConfig>
  );
}
