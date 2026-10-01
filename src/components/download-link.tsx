import { Download } from "lucide-react";

export function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex h-9 items-center gap-2 rounded bg-card px-3 text-sm font-medium transition-tesla hover:bg-accent"
    >
      <Download aria-hidden className="size-4" />
      {label}
    </a>
  );
}
