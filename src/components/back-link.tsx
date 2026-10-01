import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      transitionTypes={["tab-back"]}
      className="inline-flex items-center gap-1 rounded py-1 pr-2 text-sm text-muted-foreground transition-tesla hover:text-foreground"
    >
      <ChevronLeft className="size-4" />
      {label}
    </Link>
  );
}
