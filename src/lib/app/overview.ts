import { assessBatteryLevel, assessTirePressure } from "../assessment";
import type { Formatter } from "../format";
import { historyText } from "../history/changes";
import type { HistoryEvent } from "../history/store";
import {
  batteryCapacity,
  buildTimeline,
  type CapacityPoint,
} from "../insights";
import type { LiveFeed } from "../live/live";
import { liveNotices, liveTiles } from "../live/tiles";
import type { Preferences } from "../preferences";
import type { Car, CarSnapshot, Charge, Drive } from "../queries";
import type { DriveTotals } from "../stats-data";
import { statsTotals } from "../stats-figures";
import type { DayRecords } from "../timeline-data";
import { leakWarning, type SlowLeak } from "../tire-leak";
import {
  activityLabel,
  batteryCaption,
  batteryTone,
  carActivity,
  coldBatteryText,
  liveActivity,
  ongoingText,
  variantLine,
} from "../vehicle";
import type {
  AppValue,
  CarImageFrame,
  LiveIcon,
  OverviewCallout,
  OverviewMenuRow,
  OverviewPage,
  PeriodId,
  RecentRecord,
} from "./contract";
import { periodLabel } from "./panels";
import { appStat, appValue } from "./values";

export type OverviewInput = {
  car: Car;
  image: string | null;
  imageFrame: CarImageFrame | null;
  snapshot: CarSnapshot;
  lastDrive: Drive | null;
  lastCharge: Charge | null;
  today: (DayRecords & { start: Date; end: Date }) | null;
  live: LiveFeed | null;
  leaks: SlowLeak[];
  history: HistoryEvent[] | null;
  show: Preferences["overview"];
  showMaps: boolean;
  capacity: CapacityPoint[];
  driven: DriveTotals;
  period: PeriodId;
};

const batteryCalloutTones = {
  charge: "charge",
  low: "warning",
  normal: "normal",
} as const;

function joined(parts: (string | null | false | undefined)[]): string | null {
  const kept = parts.filter((part): part is string => Boolean(part));
  return kept.length ? kept.join(" · ") : null;
}

function recordLine(record: RecentRecord): string {
  return `${record.title} · ${record.detail}`;
}

function historyIcon(event: HistoryEvent): LiveIcon {
  if (event.kind === "locked") return event.value ? "lock" : "lock-open";
  return event.value ? "shield" : "shield-off";
}

export function dayStrip(
  today: NonNullable<OverviewInput["today"]>,
  f: Formatter,
  now: Date,
): OverviewPage["today"] {
  const start = today.start.getTime();
  const total = today.end.getTime() - start;
  const share = (date: Date) => (date.getTime() - start) / total;
  return {
    segments: buildTimeline({ ...today, now }).map((segment) => ({
      kind: segment.kind,
      start: share(segment.start),
      end: share(segment.end),
    })),
    now: Math.min(1, Math.max(0, share(now))),
    hours: [0, 6, 12, 18, 24].map((hour) => f.hour(hour)),
  };
}

function lastDriveRecord(drive: Drive, f: Formatter, now: Date): RecentRecord {
  return {
    title: `${drive.from} → ${drive.to}`,
    detail: `${f.distance(drive.distanceKm)} · ${f.duration(drive.durationMin)} · ${f.day(drive.startAt, now)} ${f.clock(drive.startAt)}`,
    target: { kind: "drive", id: drive.id },
  };
}

function lastChargeRecord(
  charge: Charge,
  f: Formatter,
  now: Date,
): RecentRecord {
  const done = charge.endAt
    ? `+${f.energy(charge.energyAddedKwh)} · ${charge.startLevel ?? "—"}% → ${charge.endLevel ?? "—"}%`
    : `${ongoingText} since ${f.clock(charge.startAt)}`;
  return {
    title: charge.place,
    detail: `${done} · ${f.day(charge.startAt, now)}`,
    target: { kind: "charge", id: charge.id },
  };
}

function tireValue(bar: number, f: Formatter): AppValue {
  return appValue(f.pressure(bar), assessTirePressure(bar, f));
}

export function overviewPage(
  input: OverviewInput,
  f: Formatter,
  now: Date,
): OverviewPage {
  const { car, snapshot, live, show } = input;
  const liveNow = live?.connected ? live.view : null;
  const chargingNow =
    liveNow?.charging.state === "Charging" ? liveNow.charging : null;
  const activity = activityLabel(
    liveActivity(liveNow?.state ?? null) ?? carActivity(snapshot),
  );
  const lastSeen = snapshot.positionAt ?? snapshot.stateSince;
  const charging = snapshot.charging || chargingNow !== null;
  const hasData =
    snapshot.batteryLevel !== null || snapshot.positionAt !== null;
  const range = f.distanceValue(snapshot.rangeKm);
  const tires = liveNow?.tires ?? snapshot.tires;
  const hasPosition = snapshot.latitude !== null && snapshot.longitude !== null;
  const batteryText =
    snapshot.batteryLevel === null ? null : `${snapshot.batteryLevel}%`;
  const rangeText =
    range === null
      ? null
      : `${f.number(Math.round(range))} ${f.units.distance}`;
  const odometer = f.distanceValue(snapshot.odometerKm);
  const odometerText =
    odometer === null
      ? "—"
      : `${f.number(Math.round(odometer))} ${f.units.distance}`;
  const seenText = lastSeen
    ? `Last seen ${f.dayInline(lastSeen, now)} at ${f.clock(lastSeen)}`
    : "Never seen";
  const caption = batteryCaption({
    level: snapshot.batteryLevel,
    usableLevel: snapshot.usableBatteryLevel,
    charging,
    limitPercent: chargingNow?.limitPercent,
  });
  const tiles = liveNow && live?.hasValues ? liveTiles(liveNow, f) : [];
  const powerText =
    chargingNow?.powerKw === null || chargingNow?.powerKw === undefined
      ? null
      : `${f.number(chargingNow.powerKw, 1)} kW`;
  const chargeText = chargingNow
    ? joined([
        powerText,
        chargingNow.limitPercent === null
          ? null
          : `to ${Math.round(chargingNow.limitPercent)}%`,
      ])
    : null;
  const lockCallout: OverviewCallout[] =
    liveNow && liveNow.locked !== null
      ? [
          {
            key: "lock",
            side: "top",
            label: "Security",
            value:
              joined([
                liveNow.locked ? "Locked" : "Unlocked",
                liveNow.sentryMode === true && "Sentry Mode on",
              ]) ?? "—",
            tone: liveNow.locked ? "normal" : "warning",
          },
        ]
      : [];
  const callouts: OverviewCallout[] = hasData
    ? [
        {
          key: "battery",
          side: "left",
          label: "Battery",
          value: joined([batteryText, rangeText]) ?? "—",
          tone: batteryCalloutTones[
            batteryTone(snapshot.batteryLevel, charging)
          ],
        },
        ...lockCallout,
        chargeText
          ? {
              key: "charging",
              side: "right",
              label: "Charging",
              value: chargeText,
              tone: "charge",
            }
          : liveNow?.charging.pluggedIn
            ? {
                key: "plug",
                side: "right",
                label: "Charge port",
                value: "Plugged in",
                tone: "normal",
              }
            : {
                key: "odometer",
                side: "right",
                label: "Odometer",
                value: odometerText,
                tone: "normal",
              },
      ]
    : [];
  const stageTiles = new Set(
    callouts.map((callout) =>
      callout.key === "plug" ? "charging" : callout.key,
    ),
  );
  const statusTiles = tiles.filter(
    (tile) => !stageTiles.has(tile.key) && tile.title !== activity.label,
  );
  const estimate = batteryCapacity(input.capacity);
  const health = estimate?.healthPercent ?? null;
  const { whPerKm, distanceTotal } = statsTotals(input.driven, null, f);
  const menu: OverviewMenuRow[] = [
    {
      key: "drives",
      title: "Drives",
      subtitle: input.lastDrive
        ? recordLine(lastDriveRecord(input.lastDrive, f, now))
        : "No drive yet",
    },
    {
      key: "charging",
      title: "Charging",
      subtitle: input.lastCharge
        ? recordLine(lastChargeRecord(input.lastCharge, f, now))
        : "No charge yet",
    },
    {
      key: "battery",
      title: "Battery",
      subtitle:
        joined([
          coldBatteryText({
            level: snapshot.batteryLevel,
            usableLevel: snapshot.usableBatteryLevel,
          }),
          health !== null && `Health ${f.number(health, 1)}%`,
          estimate && `Capacity ${f.number(estimate.nowKwh, 1)} kWh`,
        ]) ?? "No long charge yet",
    },
    {
      key: "stats",
      title: "Stats",
      subtitle: joined([
        periodLabel(input.period),
        input.driven.drives
          ? `${f.number(distanceTotal)} ${f.units.distance}`
          : "No drive",
        whPerKm !== null && f.efficiency(whPerKm),
      ]),
    },
    { key: "places", title: "Places", subtitle: "Visited and charging places" },
    ...(hasData && hasPosition
      ? [
          {
            key: "location" as const,
            title: "Location",
            subtitle: "Map and Open in Maps",
          },
        ]
      : []),
    ...(live
      ? [
          {
            key: "status" as const,
            title: "Status",
            subtitle: statusTiles.length
              ? statusTiles
                  .slice(0, 3)
                  .map((tile) => tile.title)
                  .join(" · ")
              : tiles.length
                ? null
                : "No live values yet",
          },
        ]
      : []),
    { key: "settings", title: "Settings", subtitle: null },
  ];
  return {
    car: {
      id: car.id,
      name: car.name,
      variant: variantLine(car),
      image: show.render ? input.image : null,
      imageFrame: show.render ? input.imageFrame : null,
    },
    activity: {
      label: activity.label,
      tone: activity.tone,
      updated: `Updated ${f.relative(lastSeen, now).toLowerCase()}`,
    },
    callouts,
    menu,
    empty: hasData
      ? null
      : `TeslaMate fills this page after ${car.name} wakes up and sends its first position.`,
    battery: hasData
      ? {
          level: snapshot.batteryLevel,
          usable: snapshot.usableBatteryLevel,
          value: appValue(
            snapshot.batteryLevel === null ? "—" : `${snapshot.batteryLevel}%`,
            assessBatteryLevel(snapshot.batteryLevel, charging),
          ),
          range: rangeText ?? "—",
          caption,
          tone: batteryTone(snapshot.batteryLevel, charging),
          fullAt: chargingNow?.fullAt?.toISOString() ?? null,
        }
      : null,
    stats: hasData
      ? [
          appStat("Odometer", odometerText),
          appStat("Outside", f.temperature(snapshot.outsideTemp), {
            detail:
              snapshot.climateOn === null
                ? null
                : snapshot.climateOn
                  ? "Climate on"
                  : "Climate off",
          }),
          appStat("Cabin", f.temperature(snapshot.insideTemp)),
          appStat("Software", snapshot.softwareVersion ?? "—"),
        ]
      : [],
    live:
      hasData && show.live && live
        ? {
            connected: live.connected,
            tiles: tiles.map((tile) => ({
              ...tile,
              fullAt: tile.fullAt?.toISOString() ?? null,
            })),
            notices: liveNotices(live),
            empty: live.hasValues
              ? null
              : `No live values yet. TeslaMate sends them when ${car.name} is online.`,
          }
        : null,
    history:
      show.live && input.history
        ? input.history.map((event) => ({
            key: `${event.kind}-${event.at}`,
            icon: historyIcon(event),
            title: historyText(event),
            when: `${f.day(new Date(event.at), now)} ${f.clock(new Date(event.at))}`,
            tone:
              event.kind === "locked" && !event.value ? "warning" : "normal",
          }))
        : null,
    today:
      hasData && show.today && input.today
        ? dayStrip(input.today, f, now)
        : null,
    tires:
      hasData && show.tires && tires
        ? {
            frontLeft: tireValue(tires.frontLeft, f),
            frontRight: tireValue(tires.frontRight, f),
            rearLeft: tireValue(tires.rearLeft, f),
            rearRight: tireValue(tires.rearRight, f),
            warnings: input.leaks.map((leak) =>
              leakWarning(leak, (bar) => f.pressure(bar)),
            ),
          }
        : null,
    location:
      hasData && show.location && input.showMaps && hasPosition
        ? {
            latitude: snapshot.latitude ?? 0,
            longitude: snapshot.longitude ?? 0,
            lastSeen: seenText,
          }
        : null,
    lastDrive:
      hasData && show.recent && input.lastDrive
        ? lastDriveRecord(input.lastDrive, f, now)
        : null,
    lastCharge:
      hasData && show.recent && input.lastCharge
        ? lastChargeRecord(input.lastCharge, f, now)
        : null,
  };
}
