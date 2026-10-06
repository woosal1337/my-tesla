import type { Formatter } from "../format";

export function finishText(
  fullAt: Date,
  limitPercent: number | null,
  f: Formatter,
  now: Date,
): string {
  const day = f.day(fullAt, now);
  const clock = f.clock(fullAt);
  const when = day === "Today" ? clock : `${day} ${clock}`;
  const target =
    limitPercent === null ? "Full" : `${Math.round(limitPercent)}%`;
  return `${target} at ${when}`;
}
