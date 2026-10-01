import { dayWindow, localDayKey, shiftDayKey } from "./insights";
import type { Charge, Drive } from "./queries";

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

export type TripItem =
  | { kind: "drive"; at: Date; drive: Drive }
  | { kind: "charge"; at: Date; charge: Charge };

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

export function tripItems(drives: Drive[], charges: Charge[]): TripItem[] {
  return [
    ...drives.map((drive): TripItem => ({
      kind: "drive",
      at: drive.startAt,
      drive,
    })),
    ...charges.map((charge): TripItem => ({
      kind: "charge",
      at: charge.startAt,
      charge,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
}
