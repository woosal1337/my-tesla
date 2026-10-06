import {
  BadgeCheck,
  CircleAlert,
  DoorClosed,
  DoorOpen,
  Download,
  Fan,
  Gauge,
  Lock,
  LockOpen,
  Navigation,
  Plug,
  PlugZap,
  Unplug,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { ChargeCountdown } from "@/components/charge-countdown";
import { LiveStream } from "@/components/live-stream";
import type { Formatter } from "@/lib/format";
import type { LiveFeed } from "@/lib/live/live";
import type { LiveView } from "@/lib/live/view";
import { cn } from "@/lib/utils";

type Tone = "normal" | "active" | "charge" | "warning";

type TileContent = {
  key: string;
  icon: LucideIcon;
  title: string;
  detail?: string | null;
  note?: ReactNode;
  tone?: Tone;
};

const toneClass: Record<Tone, string> = {
  normal: "text-muted-foreground",
  active: "text-primary",
  charge: "text-charge",
  warning: "text-warning",
};

function Tile({
  icon: Icon,
  title,
  detail,
  note,
  tone = "normal",
}: TileContent) {
  return (
    <div className="flex min-w-0 gap-3">
      <Icon
        aria-hidden
        className={cn("mt-0.5 size-5 shrink-0", toneClass[tone])}
      />
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        {detail && (
          <p className="mt-0.5 truncate text-sm text-subtle tabular">
            {detail}
          </p>
        )}
        {note && <p className="mt-0.5 truncate text-sm text-subtle">{note}</p>}
      </div>
    </div>
  );
}

function joined(parts: (string | null | false | undefined)[]): string | null {
  const kept = parts.filter((part): part is string => Boolean(part));
  return kept.length ? kept.join(" · ") : null;
}

function percent(value: number | null): string | null {
  return value === null ? null : `${Math.round(value)}%`;
}

function lockTile(view: LiveView): TileContent | null {
  if (view.locked === null) return null;
  return {
    key: "lock",
    icon: view.locked ? Lock : LockOpen,
    title: view.locked ? "Locked" : "Unlocked",
    detail: joined([
      view.sentryMode === true && "Sentry Mode on",
      view.sentryMode === false && "Sentry Mode off",
      view.userPresent === true && "Someone inside",
    ]),
    tone: view.locked || view.userPresent ? "normal" : "warning",
  };
}

function openingsTile(view: LiveView): TileContent | null {
  if (!view.openingsKnown) return null;
  const open = view.openParts;
  if (open.length === 0) {
    return {
      key: "openings",
      icon: DoorClosed,
      title: "All closed",
      detail: "Doors, windows, and trunks",
    };
  }
  return {
    key: "openings",
    icon: DoorOpen,
    title: open.length === 1 ? `${open[0]} open` : `${open.length} open`,
    detail: open.length === 1 ? null : open.join(", "),
    tone: "warning",
  };
}

function chargingTile(
  view: LiveView,
  f: Formatter,
  now: Date,
): TileContent | null {
  const charge = view.charging;
  if (charge.pluggedIn === null && charge.state === null) return null;
  const limit =
    charge.limitPercent === null
      ? null
      : `Limit ${percent(charge.limitPercent)}`;
  if (charge.state === "Charging" || charge.state === "Starting") {
    return {
      key: "charging",
      icon: PlugZap,
      title: "Charging",
      detail: joined([
        charge.powerKw !== null && `${f.number(charge.powerKw)} kW`,
        limit,
      ]),
      note: charge.fullAt && (
        <ChargeCountdown
          fullAt={charge.fullAt.getTime()}
          renderedAt={now.getTime()}
        />
      ),
      tone: "charge",
    };
  }
  if (charge.state === "Complete") {
    return {
      key: "charging",
      icon: Plug,
      title: "Charge complete",
      detail: limit,
      tone: "charge",
    };
  }
  if (charge.pluggedIn) {
    const title =
      charge.state === "Stopped"
        ? "Charging stopped"
        : charge.state === "NoPower"
          ? "No power"
          : "Plugged in";
    return {
      key: "charging",
      icon: Plug,
      title,
      detail: joined([
        charge.scheduledStart && `Starts at ${f.clock(charge.scheduledStart)}`,
        limit,
      ]),
      tone: charge.state === "NoPower" ? "warning" : "normal",
    };
  }
  return {
    key: "charging",
    icon: Unplug,
    title: "Not plugged in",
    detail: joined([limit, charge.portOpen === true && "Port open"]),
  };
}

const keeperModes: Record<string, string> = {
  on: "Keep climate on",
  dog: "Dog Mode",
  camp: "Camp Mode",
};

function climateTile(view: LiveView, f: Formatter): TileContent | null {
  const climate = view.climate;
  if (climate.on === null && climate.preconditioning === null) return null;
  const keeper = climate.keeperMode
    ? keeperModes[climate.keeperMode]
    : undefined;
  const title = climate.preconditioning
    ? "Preconditioning"
    : (keeper ?? (climate.on ? "Climate on" : "Climate off"));
  return {
    key: "climate",
    icon: Fan,
    title,
    detail:
      climate.insideTemp === null
        ? null
        : `Cabin ${f.temperature(climate.insideTemp)}`,
    tone: climate.on || climate.preconditioning ? "active" : "normal",
  };
}

function softwareTile(view: LiveView): TileContent | null {
  const software = view.software;
  if (software.version === null) return null;
  const next = software.updateVersion;
  if ((software.installPercent ?? 0) > 0) {
    return {
      key: "software",
      icon: Download,
      title: "Installing update",
      detail: joined([next, percent(software.installPercent)]),
      tone: "active",
    };
  }
  if (software.updateAvailable) {
    const downloading =
      software.downloadPercent !== null && software.downloadPercent < 100;
    return {
      key: "software",
      icon: Download,
      title: downloading ? "Downloading update" : "Update ready",
      detail: joined([next, downloading && percent(software.downloadPercent)]),
      tone: "active",
    };
  }
  return {
    key: "software",
    icon: BadgeCheck,
    title: "Up to date",
    detail: software.version,
  };
}

const gearTitles: Record<string, string> = {
  D: "Driving",
  R: "Reversing",
  N: "In neutral",
};

function drivingTile(view: LiveView, f: Formatter): TileContent | null {
  if (!view.driving) return null;
  return {
    key: "driving",
    icon: Gauge,
    title: gearTitles[view.driving.gear] ?? "Driving",
    detail: joined([
      view.driving.speedKmh !== null && f.speed(view.driving.speedKmh),
      view.driving.powerKw !== null && `${f.number(view.driving.powerKw)} kW`,
    ]),
    tone: "active",
  };
}

function routeTile(view: LiveView, f: Formatter): TileContent | null {
  const route = view.route;
  if (!route) return null;
  return {
    key: "route",
    icon: Navigation,
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
  };
}

function notices(feed: LiveFeed): string[] {
  const view = feed.view;
  return [
    !feed.connected && "The live feed is offline. The values can be old.",
    view.tireWarnings.length > 0 &&
      `Check the tire pressure: ${view.tireWarnings.join(", ")}.`,
    view.serviceMode === true && "Service Mode is on.",
    view.healthy === false && "The TeslaMate logger reports a problem.",
  ].filter((notice): notice is string => Boolean(notice));
}

export function LivePanel({
  carId,
  carName,
  feed,
  f,
  now,
  className,
}: {
  carId: number;
  carName: string;
  feed: LiveFeed;
  f: Formatter;
  now: Date;
  className?: string;
}) {
  const view = feed.view;
  const tiles = [
    drivingTile(view, f),
    routeTile(view, f),
    lockTile(view),
    openingsTile(view),
    chargingTile(view, f, now),
    climateTile(view, f),
    softwareTile(view),
  ].filter((tile): tile is TileContent => tile !== null);
  const alerts = notices(feed);

  return (
    <section className={cn("rounded-xl bg-card p-5", className)}>
      <LiveStream carId={carId} />
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-sm text-muted-foreground">Live</h2>
        <p className="flex items-center gap-2 text-xs text-subtle">
          <span
            className={cn(
              "size-1.5 rounded-full",
              feed.connected ? "bg-charge" : "bg-subtle",
            )}
          />
          {feed.connected ? "Connected" : "Offline"}
        </p>
      </header>
      {feed.hasValues && tiles.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <Tile {...tile} key={tile.key} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-subtle">
          No live values yet. TeslaMate sends them when {carName} is online.
        </p>
      )}
      {alerts.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-border pt-4">
          {alerts.map((alert) => (
            <li key={alert} className="flex items-start gap-2 text-sm">
              <CircleAlert
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-warning"
              />
              {alert}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
