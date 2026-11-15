import type { Formatter } from "./format";
import { tripSummary, type TripItem } from "./trip";

export function tripsDayTotal(
  trips: { distanceKm: number }[],
  f: Formatter,
): string[] {
  if (!trips.length) return [];
  const km = trips.reduce((sum, trip) => sum + trip.distanceKm, 0);
  return [
    `${trips.length} ${trips.length === 1 ? "trip" : "trips"}`,
    f.distance(km),
  ];
}

export function chargesDayTotal(
  charges: { energyAddedKwh: number | null }[],
  f: Formatter,
): string[] {
  const added = charges.flatMap(({ energyAddedKwh }) =>
    energyAddedKwh === null ? [] : [energyAddedKwh],
  );
  return added.length
    ? [`+${f.energy(added.reduce((sum, kwh) => sum + kwh, 0))}`]
    : [];
}

export function itemsDayTotal(items: TripItem[], f: Formatter): string[] {
  return [
    ...tripsDayTotal(
      items.flatMap((item) =>
        item.kind === "trip" ? [tripSummary(item.trip)] : [],
      ),
      f,
    ),
    ...chargesDayTotal(
      items.flatMap((item) => (item.kind === "charge" ? [item.charge] : [])),
      f,
    ),
  ];
}
