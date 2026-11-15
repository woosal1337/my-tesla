import { assessConsumption, ratedWhPerKm } from "../assessment";
import { itemsDayTotal } from "../day-total";
import type { Formatter } from "../format";
import type { Car, Charge, Drive } from "../queries";
import type { LngLat } from "../route";
import {
  tripItems,
  tripTotals,
  type Trip,
  type TripPreset,
  type TripRange,
} from "../trip";
import { csvFileName } from "../trip-log";
import type { DriveRow, MapMarker, ReportPage } from "./contract";
import { tripRow } from "./drives";
import { appStat, appValue } from "./values";

export type ReportInput = {
  range: TripRange | "invalid";
  presets: TripPreset[];
  trips: Trip[];
  drives: Drive[];
  charges: Charge[];
  routes: Map<number, LngLat[]> | null;
};

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function chargeRow(charge: Charge, f: Formatter): DriveRow {
  return {
    key: `charge-${charge.id}`,
    target: { kind: "charge", id: charge.id },
    clock: f.clock(charge.startAt),
    duration: f.duration(charge.durationMin),
    title: charge.place,
    subtitle: `${charge.fastCharger ? "DC" : "AC"} charge · ${charge.startLevel ?? "—"}% → ${charge.endLevel ?? "—"}%`,
    segments: [{ kind: "charge", share: 1 }],
    distance: `+${f.energy(charge.energyAddedKwh)}`,
    consumption: appValue(charge.cost === null ? "—" : f.cost(charge.cost)),
  };
}

export function reportPage(
  input: ReportInput,
  car: Car,
  f: Formatter,
  now: Date,
): ReportPage {
  const presets = input.presets.map(({ label, from, to }) => ({
    label,
    from,
    to,
  }));
  if (input.range === "invalid") {
    return {
      subtitle: null,
      from: null,
      to: null,
      presets,
      stats: [],
      routes: null,
      markers: [],
      sections: [],
      notice:
        "Choose a range of up to 366 days, with the start on or before the end.",
      exports: [],
    };
  }
  const range = input.range;
  const totals = tripTotals(input.drives, input.charges);
  const items = tripItems(input.trips, input.charges);
  const rated = ratedWhPerKm(car);
  const query = `?from=${range.from}&to=${range.to}`;
  const ascending = [...input.drives].reverse();
  const markers: MapMarker[] = input.charges.flatMap((charge) =>
    charge.latitude !== null && charge.longitude !== null
      ? [
          {
            key: String(charge.id),
            kind: "charge" as const,
            label: charge.place,
            detail: `+${f.energy(charge.energyAddedKwh)}`,
            latitude: charge.latitude,
            longitude: charge.longitude,
          },
        ]
      : [],
  );
  return {
    subtitle: `${f.date(range.start)} to ${f.date(new Date(range.end.getTime() - 1))}`,
    from: range.from,
    to: range.to,
    presets,
    stats: items.length
      ? [
          appStat(
            "Distance",
            `${f.number(f.distanceValue(totals.distanceKm) ?? 0)} ${f.units.distance}`,
          ),
          appStat("Driving", f.duration(totals.drivingMin)),
          appStat("Charging", f.duration(totals.chargingMin)),
          appStat("Consumption", f.efficiency(totals.consumptionWhPerKm), {
            assessment: assessConsumption(
              totals.consumptionWhPerKm,
              rated,
              f,
              totals.distanceKm,
            ),
          }),
          appStat("Energy used", `${f.number(totals.energyUsedKwh, 1)} kWh`),
          appStat("Energy added", `${f.number(totals.energyAddedKwh, 1)} kWh`),
          appStat("Charging cost", f.cost(totals.cost)),
          appStat("Records", plural(input.trips.length, "trip", "trips"), {
            detail: `${totals.drives} drives · ${plural(totals.charges, "charge", "charges")}`,
          }),
        ]
      : [],
    routes: input.routes
      ? ascending.flatMap((drive) => {
          const route = input.routes?.get(drive.id);
          return route ? [route] : [];
        })
      : null,
    markers: input.routes ? markers : [],
    sections: f
      .groupByDay(items, (item) => item.at, now)
      .map((group) => ({
        title: group.label,
        total: itemsDayTotal(group.items, f),
        rows: group.items.map((item) =>
          item.kind === "trip"
            ? tripRow(item.trip, rated, f)
            : chargeRow(item.charge, f),
        ),
      })),
    notice: items.length ? null : "No drive and no charge in this range.",
    exports: items.length
      ? [
          {
            label: "Drives CSV",
            path: `/api/cars/${car.id}/drives.csv${query}`,
            file: csvFileName("drives", car.name, now),
          },
          {
            label: "Charges CSV",
            path: `/api/cars/${car.id}/charges.csv${query}`,
            file: csvFileName("charges", car.name, now),
          },
        ]
      : [],
  };
}
