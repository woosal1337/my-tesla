import type { ReactNode } from "react";
import { Assessed } from "@/components/assessed";
import type { Assessment } from "@/lib/assessment";

export function Stat({
  label,
  children,
  detail,
  assessment = null,
}: {
  label: string;
  children: ReactNode;
  detail?: ReactNode;
  assessment?: Assessment | null;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-xl font-medium tabular">
        {assessment ? (
          <Assessed assessment={assessment}>{children}</Assessed>
        ) : (
          children
        )}
      </dd>
      {detail && (
        <dd className="mt-0.5 truncate text-xs text-subtle">{detail}</dd>
      )}
    </div>
  );
}
