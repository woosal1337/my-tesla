import { DotList } from "./dot-list";

export const rowLinkClass =
  "items-center gap-3 rounded-xl px-3 py-3 transition-tesla hover:bg-card focus-visible:bg-card focus-visible:-outline-offset-2 sm:gap-4 sm:px-4";

export function DayHeading({
  title,
  total,
}: {
  title: string;
  total: string[];
}) {
  return (
    <h2 className="sticky top-14 z-10 -mt-2 bg-background px-3 py-2 text-sm text-muted-foreground sm:px-4">
      <DotList parts={[title, ...total]} />
    </h2>
  );
}
