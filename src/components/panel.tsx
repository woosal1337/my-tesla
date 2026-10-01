import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-xl bg-card p-5 md:p-6",
        className,
      )}
    >
      <header className="flex min-h-6 items-center justify-between gap-4">
        <h2 className="text-sm text-muted-foreground">{title}</h2>
        {action}
      </header>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

export function PanelNote({ children }: { children: ReactNode }) {
  return (
    <p className="grid h-full min-h-32 place-items-center text-sm text-subtle">
      {children}
    </p>
  );
}
