const hourMs = 3_600_000;
const dayMs = 24 * hourMs;

function offsetMs(at: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asUtc - (at - (at % 1000));
}

export function localDayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseDayKey(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? value
    : null;
}

export function dayWindow(
  dayKey: string,
  timeZone: string,
): { start: Date; end: Date } {
  const [year, month, day] = dayKey.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day);
  let start = guess - offsetMs(guess, timeZone);
  start = guess - offsetMs(start, timeZone);
  const nextGuess = guess + dayMs;
  let end = nextGuess - offsetMs(nextGuess, timeZone);
  end = nextGuess - offsetMs(end, timeZone);
  return { start: new Date(start), end: new Date(end) };
}

export function shiftDayKey(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

export type TimelineState = {
  state: "online" | "offline" | "asleep";
  start: Date;
  end: Date | null;
};

export type TimelineDrive = {
  id: number;
  start: Date;
  end: Date;
  from: string;
  to: string;
  distanceKm: number | null;
};

export type TimelineCharge = {
  id: number;
  start: Date;
  end: Date | null;
  place: string;
  energyAddedKwh: number | null;
  fast: boolean;
};

export type TimelineSegment =
  | { kind: "drive"; start: Date; end: Date; drive: TimelineDrive }
  | { kind: "charge"; start: Date; end: Date; charge: TimelineCharge }
  | {
      kind: "online" | "asleep" | "offline";
      start: Date;
      end: Date;
    };

type Cover = {
  priority: number;
  identity: string;
  start: number;
  end: number;
  make: (start: Date, end: Date) => TimelineSegment;
};

export function buildTimeline(input: {
  states: TimelineState[];
  drives: TimelineDrive[];
  charges: TimelineCharge[];
  start: Date;
  end: Date;
  now: Date;
}): TimelineSegment[] {
  const windowStart = input.start.getTime();
  const windowEnd = Math.min(input.end.getTime(), input.now.getTime());
  if (windowEnd <= windowStart) return [];
  const clamp = (value: number) =>
    Math.min(windowEnd, Math.max(windowStart, value));
  const openEnd = (value: Date | null) => value?.getTime() ?? windowEnd;
  const covers: Cover[] = [
    ...input.states.map((state, index) => ({
      priority: 0,
      identity: `state-${index}`,
      start: state.start.getTime(),
      end: openEnd(state.end),
      make: (start: Date, end: Date): TimelineSegment => ({
        kind: state.state,
        start,
        end,
      }),
    })),
    ...input.charges.map((charge) => ({
      priority: 1,
      identity: `charge-${charge.id}`,
      start: charge.start.getTime(),
      end: openEnd(charge.end),
      make: (start: Date, end: Date): TimelineSegment => ({
        kind: "charge",
        start,
        end,
        charge,
      }),
    })),
    ...input.drives.map((drive) => ({
      priority: 2,
      identity: `drive-${drive.id}`,
      start: drive.start.getTime(),
      end: drive.end.getTime(),
      make: (start: Date, end: Date): TimelineSegment => ({
        kind: "drive",
        start,
        end,
        drive,
      }),
    })),
  ].filter((cover) => cover.end > windowStart && cover.start < windowEnd);

  const edges = [
    ...new Set(
      covers
        .flatMap((cover) => [clamp(cover.start), clamp(cover.end)])
        .concat([windowStart, windowEnd]),
    ),
  ].sort((a, b) => a - b);

  const pieces: { cover: Cover; start: number; end: number }[] = [];
  for (let index = 0; index < edges.length - 1; index += 1) {
    const from = edges[index];
    const to = edges[index + 1];
    const middle = (from + to) / 2;
    const best = covers
      .filter((cover) => cover.start <= middle && cover.end > middle)
      .sort((a, b) => b.priority - a.priority)[0];
    if (!best) continue;
    const last = pieces.at(-1);
    if (last && last.cover.identity === best.identity && last.end === from) {
      last.end = to;
    } else {
      pieces.push({ cover: best, start: from, end: to });
    }
  }
  return pieces.map((piece) =>
    piece.cover.make(new Date(piece.start), new Date(piece.end)),
  );
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export type CapacityPoint = { at: Date; kwh: number };

export function batteryHealth(points: CapacityPoint[]): {
  newKwh: number;
  nowKwh: number;
  healthPercent: number;
} | null {
  if (points.length < 3) return null;
  const sorted = [...points].sort((a, b) => a.at.getTime() - b.at.getTime());
  const newKwh = Math.max(...sorted.map((point) => point.kwh));
  const nowKwh = median(sorted.slice(-5).map((point) => point.kwh));
  if (nowKwh === null || newKwh <= 0) return null;
  return {
    newKwh,
    nowKwh,
    healthPercent: Math.min(100, (nowKwh / newKwh) * 100),
  };
}

export function levelHistogram(
  values: number[],
  step = 10,
): { level: number; count: number }[] {
  const buckets = Array.from({ length: Math.ceil(100 / step) }, (_, index) => ({
    level: index * step,
    count: 0,
  }));
  for (const value of values) {
    const index = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor(value / step)),
    );
    buckets[index].count += 1;
  }
  return buckets;
}

export type IdlePeriod = {
  start: Date;
  end: Date;
  durationS: number;
  standby: number;
  levelLost: number;
  rangeLostKm: number | null;
  energyKwh: number | null;
};

export function drainRate(periods: IdlePeriod[]): {
  kmPerDay: number;
  levelPerDay: number;
  watts: number | null;
  standby: number;
  hours: number;
} | null {
  const usable = periods.filter(
    (period) => period.rangeLostKm !== null && period.durationS > 0,
  );
  const seconds = usable.reduce((sum, period) => sum + period.durationS, 0);
  if (!seconds) return null;
  const days = seconds / 86_400;
  const sum = (pick: (period: IdlePeriod) => number) =>
    usable.reduce((total, period) => total + pick(period), 0);
  const energy = usable.every((period) => period.energyKwh !== null)
    ? sum((period) => period.energyKwh ?? 0)
    : null;
  return {
    kmPerDay: sum((period) => period.rangeLostKm ?? 0) / days,
    levelPerDay: sum((period) => period.levelLost) / days,
    watts: energy === null ? null : (energy / (seconds / 3600)) * 1000,
    standby: sum((period) => period.standby * period.durationS) / seconds,
    hours: seconds / 3600,
  };
}

const levelBands = [
  { id: "low", label: "Below 20%", from: 0, to: 20 },
  { id: "mid", label: "20 to 50%", from: 20, to: 50 },
  { id: "good", label: "50 to 80%", from: 50, to: 80 },
  { id: "high", label: "80 to 90%", from: 80, to: 90 },
  { id: "full", label: "Above 90%", from: 90, to: 101 },
] as const;

export type LevelBandId = (typeof levelBands)[number]["id"];

export function levelShares(
  samples: { level: number; weightMs: number }[],
): { id: LevelBandId; label: string; share: number }[] {
  const total = samples.reduce((sum, sample) => sum + sample.weightMs, 0);
  return levelBands.map((band) => {
    const inside = samples
      .filter((sample) => sample.level >= band.from && sample.level < band.to)
      .reduce((sum, sample) => sum + sample.weightMs, 0);
    return {
      id: band.id,
      label: band.label,
      share: total ? inside / total : 0,
    };
  });
}

export const periods = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "1y", label: "1 year", days: 365 },
  { id: "all", label: "All", days: null },
] as const;

export type PeriodId = (typeof periods)[number]["id"];

export function readPeriod(
  value: string | undefined,
  fallback: PeriodId = "30d",
): PeriodId {
  return periods.some((period) => period.id === value)
    ? (value as PeriodId)
    : fallback;
}

export function periodStart(period: PeriodId, now: Date): Date | null {
  const days = periods.find((candidate) => candidate.id === period)?.days;
  return days ? new Date(now.getTime() - days * dayMs) : null;
}

export type TimelineItem =
  | { kind: "drive"; start: Date; end: Date; drive: TimelineDrive }
  | { kind: "charge"; start: Date; end: Date; charge: TimelineCharge }
  | {
      kind: "parked";
      start: Date;
      end: Date;
      place: string | null;
      asleepMs: number;
      awakeMs: number;
      offlineMs: number;
    };

export function timelineItems(segments: TimelineSegment[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const segment of segments) {
    const length = segment.end.getTime() - segment.start.getTime();
    if (segment.kind === "drive" || segment.kind === "charge") {
      items.push(segment);
      continue;
    }
    const last = items.at(-1);
    const parked =
      last?.kind === "parked" && last.end.getTime() === segment.start.getTime()
        ? last
        : null;
    const target = parked ?? {
      kind: "parked" as const,
      start: segment.start,
      end: segment.end,
      place: null,
      asleepMs: 0,
      awakeMs: 0,
      offlineMs: 0,
    };
    target.end = segment.end;
    if (segment.kind === "asleep") target.asleepMs += length;
    else if (segment.kind === "offline") target.offlineMs += length;
    else target.awakeMs += length;
    if (!parked) items.push(target);
  }
  items.forEach((item, index) => {
    if (item.kind !== "parked") return;
    const before = items[index - 1];
    const after = items[index + 1];
    item.place =
      before?.kind === "drive"
        ? before.drive.to
        : before?.kind === "charge"
          ? before.charge.place
          : after?.kind === "drive"
            ? after.drive.from
            : after?.kind === "charge"
              ? after.charge.place
              : null;
  });
  return items;
}

export function bucketUnit(period: PeriodId): "day" | "week" | "month" {
  if (period === "7d" || period === "30d") return "day";
  if (period === "90d") return "week";
  return "month";
}

export function temperatureBands(
  points: { temperature: number; distanceKm: number; usedKwh: number }[],
  width = 5,
): {
  from: number;
  to: number;
  whPerKm: number;
  distanceKm: number;
  drives: number;
}[] {
  const bands = new Map<
    number,
    { distanceKm: number; usedKwh: number; drives: number }
  >();
  for (const point of points) {
    if (point.distanceKm <= 0) continue;
    const from = Math.floor(point.temperature / width) * width;
    const band = bands.get(from) ?? { distanceKm: 0, usedKwh: 0, drives: 0 };
    band.distanceKm += point.distanceKm;
    band.usedKwh += point.usedKwh;
    band.drives += 1;
    bands.set(from, band);
  }
  return [...bands.entries()]
    .sort(([a], [b]) => a - b)
    .map(([from, band]) => ({
      from,
      to: from + width,
      whPerKm: (band.usedKwh * 1000) / band.distanceKm,
      distanceKm: band.distanceKm,
      drives: band.drives,
    }));
}

export function weekGrid(
  rows: { weekday: number; hour: number; drives: number }[],
): number[][] {
  const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const row of rows) {
    if (row.weekday < 1 || row.weekday > 7 || row.hour < 0 || row.hour > 23) {
      continue;
    }
    grid[row.weekday - 1][row.hour] += row.drives;
  }
  return grid;
}
