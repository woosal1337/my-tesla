"use client";

import { Download, Gauge, PlugZap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { ChargeCountdown } from "@/components/charge-countdown";
import type { IslandActivity } from "@/lib/live/island";
import { cn } from "@/lib/utils";

const widths: Record<IslandActivity["key"], number> = {
  driving: 184,
  charging: 236,
  software: 244,
};

const icons = { driving: Gauge, charging: PlugZap, software: Download };

const valueTone = {
  normal: "text-white/70",
  active: "text-white/70",
  charge: "text-charge",
  warning: "text-warning",
};

const spring = { type: "spring", duration: 0.5, bounce: 0.28 } as const;
const ease = [0.23, 1, 0.32, 1] as const;

function ProgressRing({ percent }: { percent: number }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-5 -rotate-90">
      <circle
        cx="10"
        cy="10"
        r="8.5"
        className="fill-none stroke-white/20"
        strokeWidth="2"
      />
      <circle
        cx="10"
        cy="10"
        r="8.5"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100 - percent}
        strokeLinecap="round"
        strokeWidth="2"
        className="fill-none stroke-primary transition-[stroke-dashoffset] duration-(--duration) ease-(--ease-tesla)"
      />
    </svg>
  );
}

function Content({
  activity,
  renderedAt,
}: {
  activity: IslandActivity;
  renderedAt: number;
}) {
  const Icon = icons[activity.key];
  const countdown = activity.fullAt && (
    <ChargeCountdown
      fullAt={activity.fullAt.getTime()}
      renderedAt={renderedAt}
    />
  );
  return (
    <>
      <span className="relative grid size-5 shrink-0 place-items-center">
        {activity.progress !== null && (
          <ProgressRing percent={activity.progress} />
        )}
        <Icon
          aria-hidden
          className={cn(
            activity.progress === null ? "size-4" : "absolute size-2.5",
            activity.tone === "charge" ? "text-charge" : "text-primary",
          )}
        />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {activity.title}
      </span>
      {(countdown || activity.value) && (
        <span
          className={cn("shrink-0 text-sm tabular", valueTone[activity.tone])}
        >
          {countdown || activity.value}
        </span>
      )}
    </>
  );
}

export function ActivityIsland({
  activity,
  href,
  renderedAt,
}: {
  activity: IslandActivity | null;
  href: string;
  renderedAt: number;
}) {
  const label =
    activity && [activity.title, activity.value].filter(Boolean).join(", ");

  return (
    <div className="flex justify-center px-5 has-[[data-slot=activity-island]]:pb-2">
      <AnimatePresence>
        {activity && (
          <motion.div
            key="island"
            data-slot="activity-island"
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={spring}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            style={{
              width: widths[activity.key],
              height: 36,
              borderRadius: 9999,
            }}
            className="relative max-w-full overflow-hidden bg-black text-white scheme-dark shadow-[0_10px_30px_rgb(0_0_0/0.22)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1),0_10px_30px_rgb(0_0_0/0.5)]"
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={activity.key}
                layout
                transition={spring}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.22, ease, delay: 0.08 },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                  transition: { duration: 0.12 },
                }}
              >
                <Link
                  href={href}
                  aria-label={`${label}. Open the live status`}
                  className="flex size-full items-center gap-2.5 rounded-[inherit] px-3 outline-none"
                >
                  <Content activity={activity} renderedAt={renderedAt} />
                </Link>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
