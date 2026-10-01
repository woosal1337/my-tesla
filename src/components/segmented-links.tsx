import Link from "next/link";
import { cn } from "@/lib/utils";

export function SegmentedLinks({
  items,
  active,
  label,
}: {
  items: { id: string; label: string; href: string }[];
  active: string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="inline-flex rounded bg-card p-1 text-sm font-medium"
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          scroll={false}
          aria-current={item.id === active ? "page" : undefined}
          className={cn(
            "rounded px-3 py-1.5 transition-tesla",
            item.id === active
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
