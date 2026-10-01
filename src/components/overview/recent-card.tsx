import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function RecentCard({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl bg-card p-5">
      <h2 className="text-sm text-muted-foreground">{title}</h2>
      <div className="mt-3 flex-1">{children}</div>
      <Link
        href={href}
        transitionTypes={["tab-forward"]}
        className="mt-5 inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition-tesla hover:text-foreground"
      >
        {linkLabel}
        <ChevronRight className="size-4" />
      </Link>
    </section>
  );
}
