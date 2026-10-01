"use client";

import { useEffect, useState } from "react";
import { TeslaMark } from "@/components/tesla-mark";

const minimumVisibleMs = 1_150;
const fadeMs = 330;

type Phase = "open" | "closing" | "gone";

export function Splash() {
  const [phase, setPhase] = useState<Phase>("open");

  useEffect(() => {
    const close = setTimeout(
      () => setPhase("closing"),
      Math.max(0, minimumVisibleMs - performance.now()),
    );
    return () => clearTimeout(close);
  }, []);

  useEffect(() => {
    if (phase !== "closing") return;
    const remove = setTimeout(() => setPhase("gone"), fadeMs);
    return () => clearTimeout(remove);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      data-state={phase === "open" ? "open" : "done"}
      style={phase === "open" ? { viewTransitionName: "splash" } : undefined}
      className="splash fixed inset-0 z-[200] grid place-items-center bg-background"
    >
      <TeslaMark motion="draw" className="size-14 text-foreground" />
    </div>
  );
}
