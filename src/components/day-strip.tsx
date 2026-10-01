import type { TimelineSegment } from "@/lib/insights";
import { cn } from "@/lib/utils";

const tones: Record<TimelineSegment["kind"], string> = {
  drive: "bg-primary",
  charge: "bg-charge",
  online: "bg-subtle",
  asleep: "bg-subtle/35",
  offline: "bg-subtle/15",
};

const labels: Record<TimelineSegment["kind"], string> = {
  drive: "Driving",
  charge: "Charging",
  online: "Awake",
  asleep: "Asleep",
  offline: "Offline",
};

export function DayStrip({
  segments,
  start,
  end,
  now,
  hourLabels,
  size = "lg",
}: {
  segments: TimelineSegment[];
  start: Date;
  end: Date;
  now: Date;
  hourLabels: string[];
  size?: "sm" | "lg";
}) {
  const total = end.getTime() - start.getTime();
  const percent = (value: number) => `${(value / total) * 100}%`;
  const nowOffset = now.getTime() - start.getTime();
  return (
    <div>
      <div
        className={cn(
          "relative overflow-hidden rounded bg-background",
          size === "lg" ? "h-12" : "h-8",
        )}
      >
        {segments.map((segment) => {
          const offset = segment.start.getTime() - start.getTime();
          const width = segment.end.getTime() - segment.start.getTime();
          return (
            <span
              key={`${segment.kind}-${segment.start.getTime()}`}
              title={labels[segment.kind]}
              className={cn(
                "absolute inset-y-0 origin-left transition-tesla",
                tones[segment.kind],
              )}
              style={{ left: percent(offset), width: percent(width) }}
            />
          );
        })}
        {nowOffset > 0 && nowOffset < total && (
          <span
            aria-hidden
            className="absolute inset-y-0 w-px bg-foreground"
            style={{ left: percent(nowOffset) }}
          />
        )}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-subtle tabular">
        {hourLabels.map((tick, index) => (
          <span key={`${tick}-${index}`}>{tick}</span>
        ))}
      </div>
    </div>
  );
}

export function DayStripLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {(Object.keys(labels) as TimelineSegment["kind"][]).map((kind) => (
        <span key={kind} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", tones[kind])} />
          {labels[kind]}
        </span>
      ))}
    </div>
  );
}
