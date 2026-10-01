"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type RenderState = "loading" | "ready" | "failed";

export function CarRender({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<RenderState>("loading");
  if (state === "failed") return null;

  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-[10%] bottom-[6%] h-[44%] bg-[radial-gradient(closest-side,--alpha(var(--color-foreground)/6%),transparent)] dark:bg-[radial-gradient(closest-side,--alpha(var(--color-white)/9%),transparent)]"
      />
      <Image
        src={src}
        alt={alt}
        width={1440}
        height={810}
        unoptimized
        preload
        onLoad={() => setState("ready")}
        onError={() => setState("failed")}
        className={cn(
          "absolute inset-0 size-full scale-[1.18] object-cover transition-[opacity,translate] duration-700 ease-tesla motion-reduce:transition-none",
          state === "ready"
            ? "translate-y-0 opacity-100"
            : "translate-y-3 opacity-0",
        )}
      />
    </div>
  );
}
