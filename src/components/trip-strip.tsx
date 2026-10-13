import type { TripSegment } from "@/lib/trip";
import { cn } from "@/lib/utils";

const segmentClass: Record<TripSegment["kind"], string> = {
  drive: "bg-primary",
  stop: "min-w-[3px] bg-subtle/50",
  charge: "min-w-[3px] bg-charge",
};

export function TripStrip({ segments }: { segments: TripSegment[] }) {
  if (segments.length === 0) return null;
  return (
    <div
      aria-hidden
      className="mt-2 flex h-1 w-full max-w-48 gap-0.5 overflow-hidden rounded-full"
    >
      {segments.map((segment, index) => (
        <div
          key={index}
          className={cn("basis-0", segmentClass[segment.kind])}
          style={{ flexGrow: segment.share }}
        />
      ))}
    </div>
  );
}
