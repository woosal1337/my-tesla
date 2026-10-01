import type { ReactNode } from "react";
import { TeslaMark } from "@/components/tesla-mark";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  children,
  className,
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl bg-card px-6 py-16 text-center",
        className,
      )}
    >
      <TeslaMark className="size-8 text-subtle" />
      <h2 className="mt-5 text-[17px] font-medium">{title}</h2>
      {children && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {children}
        </p>
      )}
    </div>
  );
}
