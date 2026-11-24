import type { LiveIcon, LiveTone } from "../app/contract";
import type { Formatter } from "../format";
import { updatePhase, type LiveView } from "./view";

export type LiveTile = {
  key: string;
  icon: LiveIcon;
  title: string;
  detail: string | null;
  tone: LiveTone;
  fullAt: Date | null;
};

type TileInput = Omit<LiveTile, "detail" | "tone" | "fullAt"> &
  Partial<Pick<LiveTile, "detail" | "tone" | "fullAt">>;

function tile(input: TileInput): LiveTile {
  return { detail: null, tone: "normal", fullAt: null, ...input };
}

function joined(parts: (string | null | false | undefined)[]): string | null {
  const kept = parts.filter((part): part is string => Boolean(part));
  return kept.length ? kept.join(" · ") : null;
}

function percent(value: number | null): string | null {
  return value === null ? null : `${Math.round(value)}%`;
}

function lockTile(view: LiveView): LiveTile | null {
  if (view.locked === null) return null;
  return tile({
    key: "lock",
    icon: view.locked ? "lock" : "lock-open",
    title: view.locked ? "Locked" : "Unlocked",
    detail: joined([
      view.sentryMode === true && "Sentry Mode on",
      view.sentryMode === false && "Sentry Mode off",
      view.userPresent === true && "Someone inside",
    ]),
    tone: view.locked || view.userPresent ? "normal" : "warning",
  });
}

function openingsTile(view: LiveView): LiveTile | null {
  if (!view.openingsKnown) return null;
  const open = view.openParts;
  if (open.length === 0) {
    return tile({
      key: "openings",
      icon: "door-closed",
      title: "All closed",
      detail: "Doors, windows, and trunks",
    });
  }
  return tile({
    key: "openings",
    icon: "door-open",
    title: open.length === 1 ? `${open[0]} open` : `${open.length} open`,
    detail: open.length === 1 ? null : open.join(", "),
    tone: "warning",
  });
}

function chargingTile(view: LiveView, f: Formatter): LiveTile | null {
  const charge = view.charging;
  if (charge.pluggedIn === null && charge.state === null) return null;
  const limit =
    charge.limitPercent === null
      ? null
      : `Limit ${percent(charge.limitPercent)}`;
  if (charge.state === "Charging" || charge.state === "Starting") {
    return tile({
      key: "charging",
      icon: "plug-zap",
      title: "Charging",
      detail: joined([
        charge.powerKw !== null && `${f.number(charge.powerKw)} kW`,
        limit,
      ]),
      tone: "charge",
      fullAt: charge.fullAt,
    });
  }
  if (charge.state === "Complete") {
    return tile({
      key: "charging",
      icon: "plug",
      title: "Charge complete",
      detail: limit,
      tone: "charge",
    });
  }
  if (charge.pluggedIn) {
    const title =
      charge.state === "Stopped"
        ? "Charging stopped"
        : charge.state === "NoPower"
          ? "No power"
          : "Plugged in";
    return tile({
      key: "charging",
      icon: "plug",
      title,
      detail: joined([
        charge.scheduledStart && `Starts at ${f.clock(charge.scheduledStart)}`,
        limit,
      ]),
      tone: charge.state === "NoPower" ? "warning" : "normal",
    });
  }
  return tile({
    key: "charging",
    icon: "unplug",
    title: "Not plugged in",
    detail: joined([limit, charge.portOpen === true && "Port open"]),
  });
}

const keeperModes: Record<string, string> = {
  on: "Keep climate on",
  dog: "Dog Mode",
  camp: "Camp Mode",
};

function climateTile(view: LiveView, f: Formatter): LiveTile | null {
  const climate = view.climate;
  if (climate.on === null && climate.preconditioning === null) return null;
  const keeper = climate.keeperMode
    ? keeperModes[climate.keeperMode]
    : undefined;
  return tile({
    key: "climate",
    icon: "fan",
    title: climate.preconditioning
      ? "Preconditioning"
      : (keeper ?? (climate.on ? "Climate on" : "Climate off")),
    detail:
      climate.insideTemp === null
        ? null
        : `Cabin ${f.temperature(climate.insideTemp)}`,
    tone: climate.on || climate.preconditioning ? "active" : "normal",
  });
}

export const updateTitles = {
  ready: "Update ready",
  downloading: "Downloading update",
  installing: "Installing update",
};

function softwareTile(view: LiveView): LiveTile | null {
  const software = view.software;
  if (software.version === null) return null;
  const phase = updatePhase(software);
  if (phase.kind === "current") {
    return tile({
      key: "software",
      icon: "badge-check",
      title: "Up to date",
      detail: software.version,
    });
  }
  return tile({
    key: "software",
    icon: "download",
    title: updateTitles[phase.kind],
    detail: joined([
      software.updateVersion,
      phase.kind !== "ready" && percent(phase.percent),
    ]),
    tone: "active",
  });
}

export const gearTitles: Record<string, string> = {
  D: "Driving",
  R: "Reversing",
  N: "In neutral",
};

function drivingTile(view: LiveView, f: Formatter): LiveTile | null {
  if (!view.driving) return null;
  return tile({
    key: "driving",
    icon: "gauge",
    title: gearTitles[view.driving.gear] ?? "Driving",
    detail: joined([
      view.driving.speedKmh !== null && f.speed(view.driving.speedKmh),
      view.driving.powerKw !== null && `${f.number(view.driving.powerKw)} kW`,
    ]),
    tone: "active",
  });
}

function routeTile(view: LiveView, f: Formatter): LiveTile | null {
  const route = view.route;
  if (!route) return null;
  return tile({
    key: "route",
    icon: "navigation",
    title: `To ${route.destination}`,
    detail: joined([
      route.minutesToArrival !== null && f.duration(route.minutesToArrival),
      route.distanceKm !== null && f.distance(route.distanceKm),
      route.batteryAtArrival !== null &&
        `${percent(route.batteryAtArrival)} on arrival`,
      (route.trafficDelayMin ?? 0) >= 1 &&
        `+${f.duration(route.trafficDelayMin)} traffic`,
    ]),
    tone: "active",
  });
}

export function liveTiles(view: LiveView, f: Formatter): LiveTile[] {
  return [
    drivingTile(view, f),
    routeTile(view, f),
    lockTile(view),
    openingsTile(view),
    chargingTile(view, f),
    climateTile(view, f),
    softwareTile(view),
  ].filter((entry): entry is LiveTile => entry !== null);
}

export function liveNotices(feed: {
  connected: boolean;
  view: LiveView;
}): string[] {
  const view = feed.view;
  return [
    !feed.connected && "The live feed is offline. The values can be old.",
    view.tireWarnings.length > 0 &&
      `Check the tire pressure: ${view.tireWarnings.join(", ")}.`,
    view.serviceMode === true && "Service Mode is on.",
    view.healthy === false && "The TeslaMate logger reports a problem.",
  ].filter((notice): notice is string => Boolean(notice));
}
