import type { ReactNode } from "react";

export function SectionHeader({
  title,
  summary,
  action,
}: {
  title: string;
  summary?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4 pt-8 pb-8 md:pt-14">
      <div className="min-w-0">
        <h1 className="text-[40px] leading-[1.2] font-medium">{title}</h1>
        {summary && (
          <p className="mt-2 text-sm text-muted-foreground tabular">
            {summary}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
