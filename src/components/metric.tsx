import type { ReactNode } from "react";
import { Assessed } from "@/components/assessed";
import type { Assessment } from "@/lib/assessment";
import { cn } from "@/lib/utils";
import { ongoingText } from "@/lib/vehicle";

export function Metric({
  label,
  value,
  unit,
  detail,
  size = "md",
  assessment = null,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  detail?: ReactNode;
  size?: "md" | "lg";
  assessment?: Assessment | null;
}) {
  const pending = value === "—" || value === ongoingText;
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 flex items-baseline gap-1.5 font-medium tabular",
          size === "lg"
            ? "text-[clamp(24px,7.4vw,40px)] leading-none md:text-[clamp(24px,3.7vw,40px)]"
            : "text-2xl",
        )}
      >
        <span
          className={cn(
            "whitespace-nowrap",
            value === ongoingText && "text-[0.75em] text-muted-foreground",
          )}
        >
          {assessment && !pending ? (
            <Assessed assessment={assessment}>{value}</Assessed>
          ) : (
            value
          )}
        </span>
        {unit && !pending && (
          <span
            className={cn(
              "font-normal text-muted-foreground",
              size === "lg" ? "text-lg" : "text-sm",
            )}
          >
            {unit}
          </span>
        )}
      </dd>
      {detail && (
        <dd className="mt-1 truncate text-xs text-subtle">{detail}</dd>
      )}
    </div>
  );
}
