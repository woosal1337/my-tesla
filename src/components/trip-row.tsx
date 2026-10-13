import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { rowLinkClass } from "@/components/day-list";
import { cn } from "@/lib/utils";

const toneClass = {
  drive: "bg-primary text-primary-foreground",
  charge: "bg-charge text-primary-foreground",
  stop: "bg-muted text-muted-foreground",
};

const columns = "grid grid-cols-[4rem_auto_1fr]";

export function TripRow({
  href,
  clock,
  icon: Icon,
  tone,
  title,
  detail,
}: {
  href?: string;
  clock: string;
  icon: LucideIcon;
  tone: keyof typeof toneClass;
  title: string;
  detail: string;
}) {
  const cells: ReactNode = (
    <>
      <span className="text-sm font-medium tabular">{clock}</span>
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full",
          toneClass[tone],
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-sm text-muted-foreground tabular">
          {detail}
        </span>
      </span>
    </>
  );
  if (!href) {
    return (
      <div
        className={cn(
          columns,
          "items-center gap-3 rounded-xl px-3 py-3 sm:gap-4 sm:px-4",
        )}
      >
        {cells}
      </div>
    );
  }
  return (
    <Link
      href={href}
      transitionTypes={["tab-forward"]}
      className={cn(columns, rowLinkClass)}
    >
      {cells}
    </Link>
  );
}
