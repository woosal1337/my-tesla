import { CircleAlert } from "lucide-react";
import { Assessed } from "@/components/assessed";
import type { Assessment } from "@/lib/assessment";
import type { CarSnapshot } from "@/lib/queries";
import { cn } from "@/lib/utils";

type TireKey = keyof NonNullable<CarSnapshot["tires"]>;

function Tire({
  label,
  value,
  side,
  assessment,
}: {
  label: string;
  value: string;
  side: "left" | "right";
  assessment: Assessment | null;
}) {
  return (
    <div
      className={cn(
        "flex h-20 flex-col justify-center gap-0.5",
        side === "left" ? "items-end text-right" : "items-start text-left",
      )}
    >
      <span className="text-lg font-medium tabular">
        {assessment ? (
          <Assessed assessment={assessment}>{value}</Assessed>
        ) : (
          value
        )}
      </span>
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
  assess = () => null,
  warnings = [],
}: {
  tires: CarSnapshot["tires"];
  format: (bar: number) => string;
  assess?: (bar: number) => Assessment | null;
  warnings?: string[];
}) {
  const tire = (key: TireKey, label: string, side: "left" | "right") =>
    tires && (
      <Tire
        label={label}
        value={format(tires[key])}
        side={side}
        assessment={assess(tires[key])}
      />
    );
  return (
    <section className="flex flex-col rounded-xl bg-card p-5">
      <h2 className="text-sm text-muted-foreground">Tire pressure</h2>
      {tires ? (
        <div className="flex flex-1 items-center justify-center py-6">
          <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-2 items-center gap-x-6 sm:gap-x-10">
            {tire("frontLeft", "Front left", "left")}
            <CarOutline />
            {tire("frontRight", "Front right", "right")}
            {tire("rearLeft", "Rear left", "left")}
            {tire("rearRight", "Rear right", "right")}
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
