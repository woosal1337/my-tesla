import { assessConsumption, ratedWhPerKm } from "../assessment";
import { tripsDayTotal } from "../day-total";
import type { DriveEnergy, DrivePoint } from "../drive-series";
import type { Formatter } from "../format";
import { tripMarkers } from "../map-points";
import type { Car, Drive } from "../queries";
import {
  stopDetail,
  stopsText,
  tripDestination,
  tripOrigin,
  tripSegments,
  tripSteps,
  tripSummary,
  type Trip,
} from "../trip";
import { levelsUsedText } from "../vehicle";
import { buildChart } from "./chart";
import type {
  AppChart,
  AppTarget,
  DriveDetail,
  DriveRow,
  DriveList,
  LngLat,
  TripDetail,
  TripStepRow,
} from "./contract";
import { appStat, appValue, levelsText } from "./values";

export const leftOpenNotice =
  "TeslaMate did not close this drive. This happens when TeslaMate restarts during a drive. The values come from the position records.";

function dotted(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(" · ");
}

function tripTarget(trip: Trip): AppTarget {
  return trip.drives.length === 1
    ? { kind: "drive", id: trip.drives[0]!.id }
    : { kind: "trip", id: trip.id };
}

export function tripRow(
  trip: Trip,
  rated: number | null,
  f: Formatter,
): DriveRow {
  const summary = tripSummary(trip);
  return {
    key: `trip-${trip.id}`,
    target: tripTarget(trip),
    clock: f.clock(trip.startAt),
    duration: f.duration(summary.totalMin),
    title: tripDestination(trip).place,
    subtitle: dotted([tripOrigin(trip), stopsText(summary)]),
    segments: tripSegments(trip),
    distance: f.distance(summary.distanceKm),
    consumption: appValue(
      f.efficiency(summary.consumptionWhPerKm),
      assessConsumption(
        summary.consumptionWhPerKm,
        rated,
        f,
        summary.distanceKm,
      ),
    ),
  };
}

export function driveList(
  trips: Trip[],
  car: Car,
  f: Formatter,
  now: Date,
): DriveList {
  const rated = ratedWhPerKm(car);
  const summaries = trips.map((trip) => ({ trip, summary: tripSummary(trip) }));
  const totalKm = summaries.reduce(
    (sum, { summary }) => sum + summary.distanceKm,
    0,
  );
  return {
    summary: trips.length
      ? [
          `${trips.length} recent ${trips.length === 1 ? "trip" : "trips"}`,
          f.distance(totalKm),
        ]
      : [],
    sections: f
      .groupByDay(summaries, ({ trip }) => trip.startAt, now)
      .map((group) => ({
        title: group.label,
        total: tripsDayTotal(
          group.items.map(({ summary }) => summary),
          f,
        ),
        rows: group.items.map(({ trip }) => tripRow(trip, rated, f)),
      })),
  };
}

function driveCharts(series: DrivePoint[], f: Formatter): AppChart[] {
  const rows = series.map((point) => ({
    at: point.at,
    speed: f.speedValue(point.speedKmh),
    power: point.powerKw,
    elevation: f.elevationValue(point.elevationM),
    battery: point.battery,
  }));
  const common = {
    rows,
    xKey: "at",
    xFormat: "clock" as const,
    style: f.chartStyle,
  };
  return [
    buildChart({
      ...common,
      title: "Speed and power",
      left: "zero",
      series: [
        {
          key: "speed",
          label: "Speed",
          unit: f.units.speed,
          color: "chart1",
          kind: "area",
        },
        {
          key: "power",
          label: "Power",
          unit: "kW",
          color: "chart4",
          axis: "right",
        },
      ],
    }),
    buildChart({
      ...common,
      title: `Elevation (${f.units.elevation})`,
      series: [
        {
          key: "elevation",
          label: "Elevation",
          unit: f.units.elevation,
          color: "chart3",
          kind: "area",
        },
      ],
    }),
    buildChart({
      ...common,
      title: "Battery (%)",
      leftFormat: "percent",
      series: [
        { key: "battery", label: "Battery", unit: "%", color: "chart2" },
      ],
    }),
  ].filter((chart): chart is AppChart => chart !== null);
}

export function driveDetail(
  found: {
    drive: Drive;
    route: LngLat[];
    series: DrivePoint[];
    energy: DriveEnergy;
  },
  car: Car,
  f: Formatter,
  now: Date,
  showMaps: boolean,
): DriveDetail {
  const { drive, route, series, energy } = found;
  const hasSeries = series.length > 1;
  return {
    title: drive.to,
    subtitle: dotted([
      `from ${drive.from}`,
      `${f.day(drive.startAt, now)} ${f.clock(drive.startAt)} to ${f.clock(drive.endAt)}`,
      drive.outsideTempAvg !== null &&
        `${f.temperature(drive.outsideTempAvg)} outside`,
    ]),
    notice: drive.leftOpen ? leftOpenNotice : null,
    stats: [
      appStat("Distance", f.distance(drive.distanceKm)),
      appStat("Duration", f.duration(drive.durationMin)),
      appStat("Consumption", f.efficiency(drive.efficiencyWhPerKm), {
        assessment: assessConsumption(
          drive.efficiencyWhPerKm,
          ratedWhPerKm(car),
          f,
          drive.distanceKm,
        ),
      }),
      appStat("Battery", levelsText(drive.startLevel, drive.endLevel), {
        detail: levelsUsedText(drive.startLevel, drive.endLevel),
      }),
      appStat("Top speed", f.speed(drive.speedMaxKmh)),
      appStat(
        "Peak power",
        drive.powerMaxKw === null ? "—" : `${drive.powerMaxKw} kW`,
        {
          detail:
            drive.powerMinKw !== null && drive.powerMinKw < 0
              ? `Regen up to ${-drive.powerMinKw} kW`
              : null,
        },
      ),
      appStat(
        "Energy recovered",
        hasSeries ? f.energyFine(energy.recoveredKwh) : "—",
        { detail: hasSeries ? `${f.energyFine(energy.usedKwh)} used` : null },
      ),
      appStat("Climb", f.elevation(drive.ascentM), {
        detail:
          drive.descentM !== null
            ? `${f.elevation(drive.descentM)} descent`
            : null,
      }),
    ],
    charts: hasSeries ? driveCharts(series, f) : [],
    route: showMaps && route.length > 1 ? route : null,
    gpxPath: `/api/cars/${car.id}/drives/${drive.id}.gpx`,
  };
}

export function tripDetail(
  trip: Trip,
  routes: Map<number, LngLat[]>,
  car: Car,
  f: Formatter,
  now: Date,
  showMaps: boolean,
): TripDetail {
  const summary = tripSummary(trip);
  return {
    title: tripDestination(trip).place,
    subtitle: dotted([
      tripOrigin(trip),
      `${f.day(trip.startAt, now)} ${f.clock(trip.startAt)} to ${f.clock(trip.endAt)}`,
    ]),
    stats: [
      appStat("Distance", f.distance(summary.distanceKm), {
        detail: `${summary.legs} ${summary.legs === 1 ? "drive" : "drives"}`,
      }),
      appStat("Duration", f.duration(summary.totalMin), {
        detail: `${f.duration(summary.drivingMin)} driving`,
      }),
      appStat("Stopped", f.duration(summary.stoppedMin), {
        detail: stopsText(summary),
      }),
      appStat("Consumption", f.efficiency(summary.consumptionWhPerKm), {
        assessment: assessConsumption(
          summary.consumptionWhPerKm,
          ratedWhPerKm(car),
          f,
          summary.distanceKm,
        ),
      }),
      appStat("Battery", levelsText(summary.startLevel, summary.endLevel)),
      appStat("Energy used", f.energy(summary.energyUsedKwh), {
        detail:
          summary.charges > 0
            ? `+${f.energy(summary.energyAddedKwh)} added`
            : null,
      }),
      appStat("Charging cost", f.cost(summary.cost)),
      appStat("Average speed", f.speed(summary.movingSpeedKmh), {
        detail:
          summary.speedMaxKmh === null
            ? null
            : `Top ${f.speed(summary.speedMaxKmh)}`,
      }),
    ],
    steps: tripSteps(trip).map((step): TripStepRow => {
      if (step.kind === "leg") {
        const { leg } = step;
        return {
          key: `leg-${leg.driveId}`,
          kind: "drive",
          clock: f.clock(step.at),
          title: `${leg.from} → ${leg.to}`,
          detail: dotted([
            f.distance(leg.distanceKm),
            f.duration(leg.durationMin),
            f.efficiency(leg.consumptionWhPerKm),
          ]),
          target: { kind: "drive", id: leg.driveId },
        };
      }
      const { stop } = step;
      const [charge] = stop.charges;
      return {
        key: `stop-${step.at.getTime()}`,
        kind: stop.charged ? "charge" : "stop",
        clock: f.clock(step.at),
        title: stop.place,
        detail: stopDetail(stop, f),
        target: charge ? { kind: "charge", id: charge.id } : null,
      };
    }),
    routes: showMaps
      ? trip.drives.flatMap((drive) => {
          const route = routes.get(drive.id);
          return route && route.length > 1 ? [route] : [];
        })
      : null,
    markers: showMaps ? tripMarkers(trip, routes, f) : null,
  };
}
