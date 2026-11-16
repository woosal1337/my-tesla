import type { Formatter } from "../format";
import { shiftDayKey } from "../insights";
import type { DayRecords } from "../timeline-data";
import { isQuietDay, lastActiveDay, timelineView } from "../timeline-view";
import type { TimelinePage } from "./contract";
import { dayStrip } from "./overview";
import { appStat } from "./values";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function timelinePage(
  records: DayRecords,
  day: string,
  today: string,
  window: { start: Date; end: Date },
  f: Formatter,
  now: Date,
  lastActivity: Date | null,
): TimelinePage {
  const view = timelineView(records, window, now, f);
  const quiet = isQuietDay(records);
  const asleep = appStat("Asleep", `${view.asleepPercent}%`, {
    detail: "of the recorded time",
  });
  return {
    day,
    title: f.day(window.start, now),
    previous: shiftDayKey(day, -1),
    next: day < today ? shiftDayKey(day, 1) : null,
    stats: quiet
      ? view.segments.length
        ? [asleep]
        : []
      : [
          appStat(
            "Driven",
            `${f.number(Math.round(f.distanceValue(view.drivenKm) ?? 0))} ${f.units.distance}`,
            { detail: plural(records.drives.length, "drive", "drives") },
          ),
          appStat("Driving time", f.duration(view.drivingMin)),
          appStat("Charged", `${f.number(view.chargedKwh, 1)} kWh`, {
            detail: plural(records.charges.length, "session", "sessions"),
          }),
          asleep,
        ],
    strip: dayStrip({ ...records, ...window }, f, now),
    lastActive: quiet ? lastActiveDay(lastActivity, f, now) : null,
    rows: view.rows.map((row) => ({
      key: `${row.item.kind}-${row.item.start.getTime()}`,
      kind: row.item.kind,
      time: row.time,
      title: row.title,
      detail: row.detail,
      target: row.target,
    })),
  };
}
