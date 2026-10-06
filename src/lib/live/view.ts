import type { LiveValues } from "./topics";

export type LiveStamps = Readonly<Record<string, number>>;

type LiveTires = {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
};

type LiveRoute = {
  destination: string;
  distanceKm: number | null;
  minutesToArrival: number | null;
  batteryAtArrival: number | null;
  trafficDelayMin: number | null;
};

export type LiveView = {
  state: string | null;
  since: Date | null;
  healthy: boolean | null;
  locked: boolean | null;
  sentryMode: boolean | null;
  userPresent: boolean | null;
  openingsKnown: boolean;
  openParts: string[];
  charging: {
    pluggedIn: boolean | null;
    state: string | null;
    limitPercent: number | null;
    powerKw: number | null;
    hoursToFull: number | null;
    fullAt: Date | null;
    portOpen: boolean | null;
    currentA: number | null;
    currentMaxA: number | null;
    scheduledStart: Date | null;
  };
  driving: {
    gear: string;
    speedKmh: number | null;
    powerKw: number | null;
  } | null;
  route: LiveRoute | null;
  climate: {
    on: boolean | null;
    preconditioning: boolean | null;
    keeperMode: string | null;
    insideTemp: number | null;
  };
  software: {
    version: string | null;
    updateAvailable: boolean | null;
    updateVersion: string | null;
    downloadPercent: number | null;
    installPercent: number | null;
  };
  tires: LiveTires | null;
  tireWarnings: string[];
  serviceMode: boolean | null;
};

const kmPerMile = 1.609344;
const drivingGears = new Set(["D", "R", "N"]);

const openingTopics: [string, string][] = [
  ["frunk_open", "Frunk"],
  ["trunk_open", "Trunk"],
  ["driver_front_door_open", "Driver door"],
  ["driver_rear_door_open", "Driver rear door"],
  ["passenger_front_door_open", "Passenger door"],
  ["passenger_rear_door_open", "Passenger rear door"],
  ["driver_front_window_open", "Driver window"],
  ["driver_rear_window_open", "Driver rear window"],
  ["passenger_front_window_open", "Passenger window"],
  ["passenger_rear_window_open", "Passenger rear window"],
];

const tireTopics: [keyof LiveTires, string, string][] = [
  ["frontLeft", "fl", "front left"],
  ["frontRight", "fr", "front right"],
  ["rearLeft", "rl", "rear left"],
  ["rearRight", "rr", "rear right"],
];

function flag(value: string | undefined): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function amount(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function text(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "nil" ? null : trimmed;
}

function moment(value: string | undefined): Date | null {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function record(value: string | undefined): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function field(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function openParts(values: LiveValues): string[] {
  const parts = openingTopics
    .filter(([topic]) => values[topic] === "true")
    .map(([, label]) => label);
  const doorNamed = parts.some((part) => part.endsWith("door"));
  const windowNamed = parts.some((part) => part.endsWith("window"));
  if (values.doors_open === "true" && !doorNamed) parts.push("A door");
  if (values.windows_open === "true" && !windowNamed) parts.push("A window");
  const sunroofOpen = (amount(values.sun_roof_percent_open) ?? 0) > 0;
  if (values.sun_roof_installed !== "false" && sunroofOpen) {
    parts.push("Sunroof");
  }
  return parts;
}

function route(values: LiveValues): LiveRoute | null {
  const source = record(values.active_route);
  if (!source || source.error) return null;
  const destination =
    typeof source.destination === "string" ? source.destination.trim() : "";
  if (!destination) return null;
  const miles = field(source, "miles_to_arrival");
  return {
    destination,
    distanceKm: miles === null ? null : miles * kmPerMile,
    minutesToArrival: field(source, "minutes_to_arrival"),
    batteryAtArrival: field(source, "energy_at_arrival"),
    trafficDelayMin: field(source, "traffic_minutes_delay"),
  };
}

function tires(values: LiveValues): LiveTires | null {
  const entries = tireTopics.map(
    ([name, suffix]) =>
      [name, amount(values[`tpms_pressure_${suffix}`])] as const,
  );
  if (entries.some(([, value]) => value === null || value <= 0)) return null;
  return Object.fromEntries(entries) as LiveTires;
}

function updateVersion(values: LiveValues): string | null {
  const direct = text(values.update_version);
  if (direct) return direct;
  const update = record(values.software_update);
  const latest = update?.latest_version;
  return typeof latest === "string" && latest.trim() ? latest.trim() : null;
}

function fullAt(
  hoursToFull: number | null,
  receivedAt: number | undefined,
  now: number,
): Date | null {
  if (hoursToFull === null || hoursToFull <= 0) return null;
  return new Date((receivedAt ?? now) + hoursToFull * 3_600_000);
}

export function liveView(
  values: LiveValues,
  stamps: LiveStamps = {},
  now: number = Date.now(),
): LiveView {
  const gear = text(values.shift_state);
  const hoursToFull = amount(values.time_to_full_charge);
  const openingsKnown = [
    "doors_open",
    "windows_open",
    "trunk_open",
    "frunk_open",
  ].some((topic) => flag(values[topic]) !== null);
  return {
    state: text(values.state),
    since: moment(values.since),
    healthy: flag(values.healthy),
    locked: flag(values.locked),
    sentryMode: flag(values.sentry_mode),
    userPresent: flag(values.is_user_present),
    openingsKnown,
    openParts: openParts(values),
    charging: {
      pluggedIn: flag(values.plugged_in),
      state: text(values.charging_state),
      limitPercent: amount(values.charge_limit_soc),
      powerKw: amount(values.charger_power),
      hoursToFull,
      fullAt: fullAt(hoursToFull, stamps.time_to_full_charge, now),
      portOpen: flag(values.charge_port_door_open),
      currentA: amount(values.charge_current_request),
      currentMaxA: amount(values.charge_current_request_max),
      scheduledStart: moment(values.scheduled_charging_start_time),
    },
    driving:
      gear && drivingGears.has(gear)
        ? {
            gear,
            speedKmh: amount(values.speed),
            powerKw: amount(values.power),
          }
        : null,
    route: route(values),
    climate: {
      on: flag(values.is_climate_on),
      preconditioning: flag(values.is_preconditioning),
      keeperMode: text(values.climate_keeper_mode),
      insideTemp: amount(values.inside_temp),
    },
    software: {
      version: text(values.version),
      updateAvailable: flag(values.update_available),
      updateVersion: updateVersion(values),
      downloadPercent: amount(values.download_perc),
      installPercent: amount(values.install_perc),
    },
    tires: tires(values),
    tireWarnings: tireTopics
      .filter(([, suffix]) => values[`tpms_soft_warning_${suffix}`] === "true")
      .map(([, , label]) => label),
    serviceMode: flag(values.service_mode),
  };
}

export type UpdatePhase =
  | { kind: "current" }
  | { kind: "ready" }
  | { kind: "downloading"; percent: number }
  | { kind: "installing"; percent: number };

const idleInstallPercent = 1;

export function updatePhase(software: LiveView["software"]): UpdatePhase {
  if (software.updateAvailable !== true) return { kind: "current" };
  const install = software.installPercent ?? 0;
  if (install > idleInstallPercent) {
    return { kind: "installing", percent: install };
  }
  const download = software.downloadPercent;
  if (download !== null && download < 100) {
    return { kind: "downloading", percent: download };
  }
  return { kind: "ready" };
}
