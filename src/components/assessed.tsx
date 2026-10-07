"use client";

import { Popover } from "@base-ui/react/popover";
import type { ReactNode } from "react";
import { toneClass, type Assessment } from "@/lib/assessment";
import { cn } from "@/lib/utils";

export function Assessed({
  assessment,
  children,
  hint = true,
  className,
}: {
  assessment: Assessment;
  children: ReactNode;
  hint?: boolean;
  className?: string;
}) {
  const tone = toneClass[assessment.tone];
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={120}
        closeDelay={80}
        className={cn(
          "cursor-help rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
          hint &&
            "underline decoration-current/40 decoration-dotted decoration-1 underline-offset-[0.25em]",
          tone,
          className,
        )}
      >
        {children}
        <span className="sr-only">, {assessment.verdict}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="isolate z-50 outline-none"
        >
          <Popover.Popup className="w-72 max-w-[calc(100vw-24px)] origin-(--transform-origin) rounded-lg bg-popover px-3.5 py-3 text-left text-xs leading-relaxed font-normal text-popover-foreground ring-1 ring-border outline-none data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            <Popover.Title className={cn("text-sm font-medium", tone)}>
              {assessment.verdict}
            </Popover.Title>
            <Popover.Description
              render={<div />}
              className="mt-2 space-y-2 text-muted-foreground"
            >
              <p>
                <span className="font-medium text-popover-foreground">
                  Yours:{" "}
                </span>
                {assessment.meaning}
              </p>
              <p>
                <span className="font-medium text-popover-foreground">
                  Expected:{" "}
                </span>
                {assessment.expected}
              </p>
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
