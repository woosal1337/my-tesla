import type { Formatter } from "./format";
import {
  buildTimeline,
  localDayKey,
  timelineItems,
  type TimelineCharge,
  type TimelineDrive,
  type TimelineItem,
  type TimelineSegment,
  type TimelineState,
} from "./insights";
import { ongoingText } from "./vehicle";

const minuteMs = 60_000;

type DayKind = TimelineSegment["kind"];

export const dayKindLabels: Record<DayKind, string> = {
  drive: "Driving",
  charge: "Charging",
  online: "Awake",
  asleep: "Asleep",
  offline: "Offline",
};

export type DayLegendEntry = { kind: DayKind | "now"; label: string };

export function dayLegend(
  window: { start: Date; end: Date },
  now: Date,
): DayLegendEntry[] {
  const kinds = (Object.keys(dayKindLabels) as DayKind[]).map((kind) => ({
    kind,
    label: dayKindLabels[kind],
  }));
  return window.start < now && now < window.end
    ? [...kinds, { kind: "now", label: "Now" }]
    : kinds;
}

export function isQuietDay(records: {
  drives: unknown[];
  charges: unknown[];
}): boolean {
  return records.drives.length === 0 && records.charges.length === 0;
}

export function lastActiveDay(
  lastActivity: Date | null,
  f: Formatter,
  now: Date,
) {
  if (!lastActivity) return null;
  return {
    day: localDayKey(lastActivity, f.timeZone),
    title: "No drive and no charge on this day",
    detail: `Open the last day with one: ${f.day(lastActivity, now)}`,
  };
}

type TimelineTarget =
  { kind: "drive"; id: number } | { kind: "charge"; id: number } | null;

export type TimelineRow = {
  item: TimelineItem;
  time: string;
  title: string;
  detail: string;
  target: TimelineTarget;
};

function describe(item: TimelineItem, f: Formatter): TimelineRow {
  const durationOf = (ms: number) => f.duration(ms / minuteMs);
  const open = item.kind === "charge" && item.charge.end === null;
  const time = `${f.clock(item.start)} – ${open ? "Now" : f.clock(item.end)}`;
  const length = item.end.getTime() - item.start.getTime();
  if (item.kind === "drive") {
    return {
      item,
      time,
      title: `Drive to ${item.drive.to}`,
      detail: `${f.distance(item.drive.distanceKm)} · ${durationOf(length)} · from ${item.drive.from}`,
      target: { kind: "drive", id: item.drive.id },
    };
  }
  if (item.kind === "charge") {
    return {
      item,
      time,
      title: `${open ? "Charging" : "Charged"} at ${item.charge.place}`,
      detail: `${open ? ongoingText : `+${f.energy(item.charge.energyAddedKwh)}`} · ${durationOf(length)} · ${item.charge.fast ? "DC" : "AC"}`,
      target: { kind: "charge", id: item.charge.id },
    };
  }
  return {
    item,
    time,
    title: item.place ? `Parked at ${item.place}` : "Parked",
    detail: [
      item.asleepMs ? `asleep ${durationOf(item.asleepMs)}` : null,
      item.awakeMs ? `awake ${durationOf(item.awakeMs)}` : null,
      item.offlineMs ? `offline ${durationOf(item.offlineMs)}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    target: null,
  };
}

export type RestShare = { label: string; percent: number; detail: string };

export function restShare(
  asleepMs: number,
  offlineMs: number,
  coveredMs: number,
): RestShare {
  const share = (kind: "asleep" | "offline", ms: number) => ({
    label: dayKindLabels[kind],
    percent: coveredMs ? Math.round((ms / coveredMs) * 100) : 0,
  });
  const asleep = share("asleep", asleepMs);
  const offline = share("offline", offlineMs);
  const [shown, other] =
    offlineMs > asleepMs ? [offline, asleep] : [asleep, offline];
  return {
    label: shown.label,
    percent: shown.percent,
    detail: other.percent
      ? `of the recorded time · ${other.label.toLowerCase()} ${other.percent}%`
      : "of the recorded time",
  };
}

export function timelineView(
  records: {
    states: TimelineState[];
    drives: TimelineDrive[];
    charges: TimelineCharge[];
  },
  window: { start: Date; end: Date },
  now: Date,
  f: Formatter,
) {
  const segments = buildTimeline({ ...records, ...window, now });
  const rows = timelineItems(segments)
    .filter((item) => item.end.getTime() - item.start.getTime() >= minuteMs)
    .map((item) => describe(item, f));
  const sum = (kind: string) =>
    segments
      .filter((segment) => segment.kind === kind)
      .reduce(
        (total, segment) =>
          total + segment.end.getTime() - segment.start.getTime(),
        0,
      );
  const covered = segments.reduce(
    (total, segment) => total + segment.end.getTime() - segment.start.getTime(),
    0,
  );
  return {
    segments,
    rows,
    drivenKm: records.drives.reduce(
      (total, drive) => total + (drive.distanceKm ?? 0),
      0,
    ),
    chargedKwh: records.charges.reduce(
      (total, charge) => total + (charge.energyAddedKwh ?? 0),
      0,
    ),
    drivingMin: sum("drive") / minuteMs,
    rest: restShare(sum("asleep"), sum("offline"), covered),
  };
}
