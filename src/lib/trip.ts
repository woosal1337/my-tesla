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

export type Trip = {
  id: number;
  startAt: Date;
  endAt: Date;
  from: string;
  to: string;
  drives: Drive[];
  stops: TripStop[];
};

export type TripSummary = TripTotals & {
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
  | { kind: "drive"; at: Date; drive: Drive }
  | { kind: "stop"; at: Date; stop: TripStop };

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

export function buildTrips(
  legs: TripLegRow[],
  drives: Drive[],
  charges: Charge[],
): Trip[] {
  const driveOf = new Map(drives.map((drive) => [drive.id, drive]));
  const trips = new Map<number, Trip>();
  for (const leg of legs) {
    const drive = driveOf.get(leg.driveId);
    if (!drive) continue;
    const trip = trips.get(leg.tripId);
    if (!trip) {
      trips.set(leg.tripId, {
        id: leg.tripId,
        startAt: drive.startAt,
        endAt: drive.endAt,
        from: drive.from,
        to: drive.to,
        drives: [drive],
        stops: [],
      });
      continue;
    }
    const before = trip.drives[trip.drives.length - 1];
    trip.stops.push(stopBetween(before, drive, leg.chargedBefore, charges));
    trip.drives.push(drive);
    trip.endAt = drive.endAt;
    trip.to = drive.to;
  }
  return [...trips.values()];
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
  return trip.drives.flatMap((drive, index): TripStep[] => {
    const stop = trip.stops[index];
    return [
      { kind: "drive", at: drive.startAt, drive },
      ...(stop ? [{ kind: "stop" as const, at: stop.startAt, stop }] : []),
    ];
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
