import type { ReactNode } from "react";

export function Stat({
  label,
  children,
  detail,
}: {
  label: string;
  children: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-xl font-medium tabular">{children}</dd>
      {detail && (
        <dd className="mt-0.5 truncate text-xs text-subtle">{detail}</dd>
      )}
    </div>
  );
}
