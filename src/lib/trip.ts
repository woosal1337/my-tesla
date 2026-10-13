import { dayWindow, localDayKey, shiftDayKey } from "./insights";
import type { Charge, Drive } from "./queries";
import type { TripLegRow } from "./trip-legs-sql";

export type TripRange = { from: string; to: string; start: Date; end: Date };

export type TripPreset = { label: string; from: string; to: string };

export type TripTotals = {
  drives: number;
  charges: number;
  distanceKm: number;
  drivingMin: number;
  chargingMin: number;
  energyUsedKwh: number;
  energyAddedKwh: number;
  cost: number | null;
  consumptionWhPerKm: number | null;
};

export type TripStop = {
  startAt: Date;
  endAt: Date;
  durationMin: number;
  place: string;
  charged: boolean;
  charges: Charge[];
};

type TripLeg = {
  driveId: number;
  startAt: Date;
  endAt: Date;
  durationMin: number;
  from: string;
  to: string;
  distanceKm: number;
  consumptionWhPerKm: number | null;
  drives: Drive[];
};

export type Trip = {
  id: number;
  startAt: Date;
  endAt: Date;
  from: string;
  to: string;
  drives: Drive[];
  legs: TripLeg[];
  stops: TripStop[];
};

export type TripSummary = TripTotals & {
  legs: number;
  totalMin: number;
  stoppedMin: number;
  stops: number;
  chargingStops: number;
  movingSpeedKmh: number | null;
  speedMaxKmh: number | null;
  startLevel: number | null;
  endLevel: number | null;
};

export type TripItem =
  | { kind: "trip"; at: Date; trip: Trip }
  | { kind: "charge"; at: Date; charge: Charge };

export type TripStep =
  | { kind: "leg"; at: Date; leg: TripLeg }
  | { kind: "stop"; at: Date; stop: TripStop };

export type TripSegment = { kind: "drive" | "stop" | "charge"; share: number };

const shortestStopMs = 2 * 60_000;
const shortestLegKm = 0.05;

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const longestTripDays = 366;
export function tripRange(
  from: string | null,
  to: string | null,
  timeZone: string,
  now: Date,
): TripRange | "invalid" {
  const end = to || localDayKey(now, timeZone);
  const start = from || shiftDayKey(end, -6);
  if (!dayPattern.test(start) || !dayPattern.test(end)) return "invalid";
  const span =
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
    86_400_000;
  if (Number.isNaN(span) || span < 0 || span >= longestTripDays) {
    return "invalid";
  }
  return {
    from: start,
    to: end,
    start: dayWindow(start, timeZone).start,
    end: dayWindow(end, timeZone).end,
  };
}

export function tripPresets(now: Date, timeZone: string): TripPreset[] {
  const today = localDayKey(now, timeZone);
  return [
    { label: "Last 7 days", from: shiftDayKey(today, -6), to: today },
    { label: "Last 30 days", from: shiftDayKey(today, -29), to: today },
    { label: "This month", from: `${today.slice(0, 8)}01`, to: today },
    { label: "This year", from: `${today.slice(0, 5)}01-01`, to: today },
  ];
}

export function tripTotals(drives: Drive[], charges: Charge[]): TripTotals {
  let distanceKm = 0;
  let drivingMin = 0;
  let energyUsedKwh = 0;
  let measuredKm = 0;
  for (const drive of drives) {
    distanceKm += drive.distanceKm ?? 0;
    drivingMin += drive.durationMin ?? 0;
    if (drive.efficiencyWhPerKm !== null && drive.distanceKm !== null) {
      energyUsedKwh += (drive.efficiencyWhPerKm * drive.distanceKm) / 1000;
      measuredKm += drive.distanceKm;
    }
  }
  const costs = charges
    .map((charge) => charge.cost)
    .filter((cost): cost is number => cost !== null);
  return {
    drives: drives.length,
    charges: charges.length,
    distanceKm,
    drivingMin,
    chargingMin: charges.reduce(
      (sum, charge) => sum + (charge.durationMin ?? 0),
      0,
    ),
    energyUsedKwh,
    energyAddedKwh: charges.reduce(
      (sum, charge) => sum + (charge.energyAddedKwh ?? 0),
      0,
    ),
    cost: costs.length ? costs.reduce((sum, cost) => sum + cost, 0) : null,
    consumptionWhPerKm:
      measuredKm > 0 ? (energyUsedKwh * 1000) / measuredKm : null,
  };
}

function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

function stopBetween(
  before: Drive,
  after: Drive,
  chargedBefore: boolean,
  charges: Charge[],
): TripStop {
  const during = charges.filter(
    (charge) =>
      charge.startAt >= before.endAt && charge.startAt < after.startAt,
  );
  return {
    startAt: before.endAt,
    endAt: after.startAt,
    durationMin: minutesBetween(before.endAt, after.startAt),
    place: during[0]?.place ?? before.to,
    charged: chargedBefore || during.length > 0,
    charges: during,
  };
}

function isPause(stop: TripStop): boolean {
  return (
    !stop.charged &&
    stop.endAt.getTime() - stop.startAt.getTime() < shortestStopMs
  );
}

function joinStops(first: TripStop, second: TripStop): TripStop {
  return {
    startAt: first.startAt,
    endAt: second.endAt,
    durationMin: minutesBetween(first.startAt, second.endAt),
    place:
      first.charges.length || !second.charges.length
        ? first.place
        : second.place,
    charged: first.charged || second.charged,
    charges: [...first.charges, ...second.charges],
  };
}

function legOf(drives: Drive[]): TripLeg {
  const first = drives[0];
  const last = drives[drives.length - 1];
  const totals = tripTotals(drives, []);
  const longest = drives.reduce((longer, drive) =>
    (drive.distanceKm ?? 0) > (longer.distanceKm ?? 0) ? drive : longer,
  );
  return {
    driveId: longest.id,
    startAt: first.startAt,
    endAt: last.endAt,
    durationMin: minutesBetween(first.startAt, last.endAt),
    from: first.from,
    to: last.to,
    distanceKm: totals.distanceKm,
    consumptionWhPerKm: totals.consumptionWhPerKm,
    drives,
  };
}

type Run = { stopBefore: TripStop | null; drives: Drive[] };

function runsOf(
  rows: { drive: Drive; chargedBefore: boolean }[],
  charges: Charge[],
): Run[] {
  const runs: Run[] = [];
  rows.forEach(({ drive, chargedBefore }, index) => {
    const run = runs[runs.length - 1];
    if (index === 0 || !run) {
      runs.push({ stopBefore: null, drives: [drive] });
      return;
    }
    const stop = stopBetween(
      rows[index - 1].drive,
      drive,
      chargedBefore,
      charges,
    );
    if (isPause(stop)) run.drives.push(drive);
    else runs.push({ stopBefore: stop, drives: [drive] });
  });
  return runs;
}

function tripOf(id: number, runs: Run[]): Trip | null {
  const legs: TripLeg[] = [];
  const stops: TripStop[] = [];
  let waited: TripStop | null = null;
  for (const run of runs) {
    if (run.stopBefore) {
      waited = waited ? joinStops(waited, run.stopBefore) : run.stopBefore;
    }
    const leg = legOf(run.drives);
    if (leg.distanceKm < shortestLegKm) continue;
    if (legs.length > 0 && waited) stops.push(waited);
    legs.push(leg);
    waited = null;
  }
  if (legs.length === 0) return null;
  const last = legs[legs.length - 1];
  return {
    id,
    startAt: legs[0].startAt,
    endAt: last.endAt,
    from: legs[0].from,
    to: last.to,
    drives: legs.flatMap((leg) => leg.drives),
    legs,
    stops,
  };
}

export function buildTrips(
  legs: TripLegRow[],
  drives: Drive[],
  charges: Charge[],
): Trip[] {
  const driveOf = new Map(drives.map((drive) => [drive.id, drive]));
  const rowsOf = new Map<number, { drive: Drive; chargedBefore: boolean }[]>();
  for (const leg of legs) {
    const drive = driveOf.get(leg.driveId);
    if (!drive) continue;
    const rows = rowsOf.get(leg.tripId) ?? [];
    rows.push({ drive, chargedBefore: leg.chargedBefore });
    rowsOf.set(leg.tripId, rows);
  }
  return [...rowsOf].flatMap(([id, rows]) => {
    const trip = tripOf(id, runsOf(rows, charges));
    return trip ? [trip] : [];
  });
}

function tripCharges(trip: Trip): Charge[] {
  return trip.stops.flatMap((stop) => stop.charges);
}

function largest(values: (number | null)[]): number | null {
  const known = values.filter((value): value is number => value !== null);
  return known.length ? Math.max(...known) : null;
}

export function tripSummary(trip: Trip): TripSummary {
  const totals = tripTotals(trip.drives, tripCharges(trip));
  return {
    ...totals,
    legs: trip.legs.length,
    totalMin: minutesBetween(trip.startAt, trip.endAt),
    stoppedMin: trip.stops.reduce((sum, stop) => sum + stop.durationMin, 0),
    stops: trip.stops.length,
    chargingStops: trip.stops.filter((stop) => stop.charged).length,
    movingSpeedKmh:
      totals.drivingMin > 0
        ? (totals.distanceKm / totals.drivingMin) * 60
        : null,
    speedMaxKmh: largest(trip.drives.map((drive) => drive.speedMaxKmh)),
    startLevel: trip.drives[0].startLevel,
    endLevel: trip.drives[trip.drives.length - 1].endLevel,
  };
}

export function stopsText(summary: {
  stops: number;
  chargingStops: number;
}): string | null {
  if (summary.stops === 0) return null;
  const stops = summary.stops === 1 ? "1 stop" : `${summary.stops} stops`;
  return summary.chargingStops > 0
    ? `${stops}, ${summary.chargingStops} with a charge`
    : stops;
}

export function tripDestination(trip: Trip): {
  place: string;
  roundTrip: boolean;
} {
  if (trip.from !== trip.to || trip.stops.length === 0) {
    return { place: trip.to, roundTrip: false };
  }
  const longest = trip.stops.reduce((longer, stop) =>
    stop.durationMin > longer.durationMin ? stop : longer,
  );
  return { place: longest.place, roundTrip: true };
}

export function tripSteps(trip: Trip): TripStep[] {
  return trip.legs.flatMap((leg, index): TripStep[] => {
    const stop = trip.stops[index];
    return [
      { kind: "leg", at: leg.startAt, leg },
      ...(stop ? [{ kind: "stop" as const, at: stop.startAt, stop }] : []),
    ];
  });
}

export function tripPath(trip: Trip): string {
  return trip.drives.length === 1
    ? `/drives/${trip.drives[0].id}`
    : `/drives/trip/${trip.id}`;
}

export function tripOrigin(trip: Trip): string {
  const { roundTrip } = tripDestination(trip);
  return `${roundTrip ? "round trip from" : "from"} ${trip.from}`;
}

export function newestFirst(trips: Trip[]): Trip[] {
  return [...trips].sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
}

export function tripSegments(trip: Trip): TripSegment[] {
  const totalMs = trip.endAt.getTime() - trip.startAt.getTime();
  if (totalMs <= 0 || trip.stops.length === 0) return [];
  return tripSteps(trip).map((step): TripSegment => {
    const { startAt, endAt } = step.kind === "leg" ? step.leg : step.stop;
    const share = (endAt.getTime() - startAt.getTime()) / totalMs;
    if (step.kind === "leg") return { kind: "drive", share };
    return { kind: step.stop.charged ? "charge" : "stop", share };
  });
}

export function tripItems(trips: Trip[], charges: Charge[]): TripItem[] {
  const onTheWay = new Set(
    trips.flatMap((trip) => tripCharges(trip).map((charge) => charge.id)),
  );
  return [
    ...trips.map((trip): TripItem => ({
      kind: "trip",
      at: trip.startAt,
      trip,
    })),
    ...charges
      .filter((charge) => !onTheWay.has(charge.id))
      .map((charge): TripItem => ({
        kind: "charge",
        at: charge.startAt,
        charge,
      })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
}
