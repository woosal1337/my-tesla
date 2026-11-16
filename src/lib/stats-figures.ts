import type { Formatter } from "./format";
import { temperatureBands } from "./insights";
import type {
  DriveTotals,
  EfficiencyPoint,
  PressurePoint,
  SoftwareUpdate,
  StatsBucket,
} from "./stats-data";

const dayMs = 86_400_000;
const shortestScatterKm = 3;

function round1(value: number | null): number | null {
  return value === null ? null : Math.round(value * 10) / 10;
}

export function statsTotals(
  drives: Pick<DriveTotals, "distanceKm" | "usedKwh">,
  chargeCost: number | null,
  f: Formatter,
) {
  const distanceTotal = f.distanceValue(drives.distanceKm) ?? 0;
  return {
    whPerKm: drives.distanceKm
      ? (drives.usedKwh * 1000) / drives.distanceKm
      : null,
    distanceTotal,
    costPer100:
      chargeCost !== null && distanceTotal
        ? (chargeCost / distanceTotal) * 100
        : null,
  };
}

export function bucketRows(buckets: StatsBucket[], f: Formatter) {
  return buckets.map((bucket) => ({
    at: bucket.at.getTime(),
    distance: round1(f.distanceValue(bucket.distanceKm)),
    used: round1(bucket.usedKwh),
    charged: round1(bucket.chargedKwh),
    cost: bucket.cost === null ? null : Math.round(bucket.cost * 100) / 100,
    outside: round1(f.temperatureValue(bucket.outsideC)),
    cabin: round1(f.temperatureValue(bucket.cabinC)),
  }));
}

export function pressureRows(pressure: PressurePoint[], f: Formatter) {
  return pressure.map((point) => ({
    at: point.at.getTime(),
    frontLeft: f.pressureValue(point.frontLeft),
    frontRight: f.pressureValue(point.frontRight),
    rearLeft: f.pressureValue(point.rearLeft),
    rearRight: f.pressureValue(point.rearRight),
  }));
}

export function efficiencyScatter(points: EfficiencyPoint[], f: Formatter) {
  return points
    .filter((point) => point.distanceKm >= shortestScatterKm)
    .map((point) => ({
      x: f.temperatureValue(point.temperature) ?? point.temperature,
      y: f.efficiencyValue((point.usedKwh * 1000) / point.distanceKm) ?? 0,
    }));
}

export function efficiencyBands(
  points: EfficiencyPoint[],
  f: Formatter,
  fahrenheit: boolean,
) {
  const bands = temperatureBands(
    points.map((point) => ({
      ...point,
      temperature: f.temperatureValue(point.temperature) ?? point.temperature,
    })),
    fahrenheit ? 10 : 5,
  );
  const distanceKm = bands.reduce((sum, band) => sum + band.distanceKm, 0);
  return bands.map((band) => ({
    ...band,
    share: band.distanceKm / distanceKm,
  }));
}

export function updateDays(
  updates: SoftwareUpdate[],
  now: Date,
): { update: SoftwareUpdate; days: number }[] {
  return updates.map((update, index) => {
    const until = updates[index - 1]?.startAt ?? now;
    return {
      update,
      days: Math.max(
        0,
        Math.round((until.getTime() - update.startAt.getTime()) / dayMs),
      ),
    };
  });
}
