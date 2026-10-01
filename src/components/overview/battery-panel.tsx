"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { cn } from "@/lib/utils";

type BatteryPanelProps = {
  level: number | null;
  usableLevel: number | null;
  range: number | null;
  rangeUnit: string;
  locale: string;
  animated: boolean;
  tone: "charge" | "low" | "normal";
  caption: string;
};

const fillTone = {
  charge: "bg-charge",
  low: "bg-destructive",
  normal: "bg-foreground",
};

export function BatteryPanel({
  level,
  usableLevel,
  range,
  rangeUnit,
  locale,
  animated,
  tone,
  caption,
}: BatteryPanelProps) {
  const width = Math.min(100, Math.max(0, level ?? 0));
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <AnimatedNumber
          value={level}
          suffix="%"
          locale={locale}
          animated={animated}
          className="text-[64px] leading-none font-medium tracking-tight tabular"
        />
        <span className="text-lg text-muted-foreground tabular">
          <AnimatedNumber value={range} locale={locale} animated={animated} />{" "}
          {rangeUnit}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Battery level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={level ?? undefined}
        className="relative mt-6 h-2 overflow-hidden rounded-full bg-muted"
      >
        {usableLevel !== null && level !== null && usableLevel < level && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-subtle/40"
            style={{ width: `${width}%` }}
          />
        )}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-tesla starting:w-0!",
            fillTone[tone],
            tone === "charge" && "animate-pulse",
          )}
          style={{
            width: `${Math.min(100, Math.max(0, usableLevel ?? level ?? 0))}%`,
          }}
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{caption}</p>
    </div>
  );
}
