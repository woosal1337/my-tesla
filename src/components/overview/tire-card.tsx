import { CircleAlert } from "lucide-react";
import type { CarSnapshot } from "@/lib/queries";
import { cn } from "@/lib/utils";

function Tire({
  label,
  value,
  side,
}: {
  label: string;
  value: string;
  side: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex h-20 flex-col justify-center gap-0.5",
        side === "left" ? "items-end text-right" : "items-start text-left",
      )}
    >
      <span className="text-lg font-medium tabular">{value}</span>
      <span className="text-xs text-subtle">{label}</span>
    </div>
  );
}

function Wheel({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={cn("absolute h-6 w-1.5 rounded-full bg-input", className)}
    />
  );
}

function CarOutline() {
  return (
    <div
      aria-hidden
      className="relative row-span-2 h-40 w-16 rounded-[22px] border-2 border-input"
    >
      <Wheel className="top-7 -left-[5px]" />
      <Wheel className="top-7 -right-[5px]" />
      <Wheel className="bottom-7 -left-[5px]" />
      <Wheel className="bottom-7 -right-[5px]" />
      <span className="absolute inset-x-2.5 top-9 h-5 rounded-md bg-muted" />
      <span className="absolute inset-x-2.5 bottom-7 h-4 rounded-md bg-muted" />
    </div>
  );
}

export function TireCard({
  tires,
  format,
  warnings = [],
}: {
  tires: CarSnapshot["tires"];
  format: (bar: number) => string;
  warnings?: string[];
}) {
  return (
    <section className="flex flex-col rounded-xl bg-card p-5">
      <h2 className="text-sm text-muted-foreground">Tire pressure</h2>
      {tires ? (
        <div className="flex flex-1 items-center justify-center py-6">
          <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-2 items-center gap-x-6 sm:gap-x-10">
            <Tire
              label="Front left"
              value={format(tires.frontLeft)}
              side="left"
            />
            <CarOutline />
            <Tire
              label="Front right"
              value={format(tires.frontRight)}
              side="right"
            />
            <Tire
              label="Rear left"
              value={format(tires.rearLeft)}
              side="left"
            />
            <Tire
              label="Rear right"
              value={format(tires.rearRight)}
              side="right"
            />
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-subtle">
          The car sends tire pressure after it drives.
        </p>
      )}
      {warnings.map((warning) => (
        <p key={warning} className="mt-3 flex items-start gap-2 text-sm">
          <CircleAlert
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-warning"
          />
          {warning}
        </p>
      ))}
    </section>
  );
}
