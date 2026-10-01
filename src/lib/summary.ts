import type { LiveFeed } from "./live/live";
import type { LiveView } from "./live/view";
import type { Car, CarSnapshot } from "./queries";
import {
  carActivity,
  liveActivity,
  modelName,
  type CarActivity,
} from "./vehicle";

type Tires = {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
};

type LiveSummary = {
  connected: true;
  locked: boolean | null;
  sentryMode: boolean | null;
  userPresent: boolean | null;
  openParts: string[] | null;
  charging: {
    pluggedIn: boolean | null;
    state: string | null;
    limitPercent: number | null;
    powerKw: number | null;
    hoursToFull: number | null;
    scheduledStart: string | null;
  };
  driving: {
    gear: string;
    speedKmh: number | null;
    powerKw: number | null;
  } | null;
  climate: {
    on: boolean | null;
    preconditioning: boolean | null;
    insideTempC: number | null;
  };
  software: {
    version: string | null;
    updateAvailable: boolean | null;
    updateVersion: string | null;
  };
  tiresBar: Tires | null;
  tireWarnings: string[];
};

type Navigation = {
  destination: string;
  distanceKm: number | null;
  minutesToArrival: number | null;
  batteryAtArrivalPercent: number | null;
};

export type CarSummary = {
  car: { id: number; name: string; model: string; trim: string | null };
  state: CarActivity;
  stateSince: string | null;
  updatedAt: string | null;
  battery: {
    levelPercent: number | null;
    usableLevelPercent: number | null;
    rangeKm: number | null;
    rangeKind: "rated" | "ideal";
    at: string | null;
  };
  odometerKm: number | null;
  outsideTempC: number | null;
  insideTempC: number | null;
  climateOn: boolean | null;
  tiresBar: Tires | null;
  softwareVersion: string | null;
  live: LiveSummary | { connected: false } | null;
  location?: {
    latitude: number | null;
    longitude: number | null;
    at: string | null;
    navigation: Navigation | null;
  };
  generatedAt: string;
};

export type SummaryInput = {
  car: Car;
  snapshot: CarSnapshot;
  live: LiveFeed | null;
  rangeKind: "rated" | "ideal";
  includeLocation: boolean;
  now: Date;
};

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function round(value: number | null, digits: number): number | null {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundTires(tires: Tires | null): Tires | null {
  if (!tires) return null;
  return {
    frontLeft: round(tires.frontLeft, 2) ?? 0,
    frontRight: round(tires.frontRight, 2) ?? 0,
    rearLeft: round(tires.rearLeft, 2) ?? 0,
    rearRight: round(tires.rearRight, 2) ?? 0,
  };
}

function liveSummary(view: LiveView): LiveSummary {
  return {
    connected: true,
    locked: view.locked,
    sentryMode: view.sentryMode,
    userPresent: view.userPresent,
    openParts: view.openingsKnown ? view.openParts : null,
    charging: {
      pluggedIn: view.charging.pluggedIn,
      state: view.charging.state,
      limitPercent: view.charging.limitPercent,
      powerKw: view.charging.powerKw,
      hoursToFull: view.charging.hoursToFull,
      scheduledStart: iso(view.charging.scheduledStart),
    },
    driving: view.driving,
    climate: {
      on: view.climate.on,
      preconditioning: view.climate.preconditioning,
      insideTempC: view.climate.insideTemp,
    },
    software: {
      version: view.software.version,
      updateAvailable: view.software.updateAvailable,
      updateVersion: view.software.updateVersion,
    },
    tiresBar: roundTires(view.tires),
    tireWarnings: view.tireWarnings,
  };
}

function navigation(view: LiveView | null): Navigation | null {
  if (!view?.route) return null;
  return {
    destination: view.route.destination,
    distanceKm: round(view.route.distanceKm, 1),
    minutesToArrival: view.route.minutesToArrival,
    batteryAtArrivalPercent: view.route.batteryAtArrival,
  };
}

export function carSummary(input: SummaryInput): CarSummary {
  const { car, snapshot, live } = input;
  const liveNow = live?.connected ? live.view : null;
  const summary: CarSummary = {
    car: {
      id: car.id,
      name: car.name,
      model: modelName(car.model),
      trim: car.marketingName,
    },
    state: liveActivity(liveNow?.state ?? null) ?? carActivity(snapshot),
    stateSince: iso(snapshot.stateSince),
    updatedAt: iso(snapshot.positionAt ?? snapshot.stateSince),
    battery: {
      levelPercent: snapshot.batteryLevel,
      usableLevelPercent: snapshot.usableBatteryLevel,
      rangeKm: round(snapshot.rangeKm, 1),
      rangeKind: input.rangeKind,
      at: iso(snapshot.batteryAt),
    },
    odometerKm: round(snapshot.odometerKm, 1),
    outsideTempC: snapshot.outsideTemp,
    insideTempC: snapshot.insideTemp,
    climateOn: snapshot.climateOn,
    tiresBar: roundTires(snapshot.tires),
    softwareVersion: snapshot.softwareVersion,
    live: live ? (liveNow ? liveSummary(liveNow) : { connected: false }) : null,
    generatedAt: input.now.toISOString(),
  };
  if (input.includeLocation) {
    summary.location = {
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      at: iso(snapshot.positionAt),
      navigation: navigation(liveNow),
    };
  }
  return summary;
}

export function wantsLocation(value: string | null): boolean {
  return value === "1" || value === "true";
}
