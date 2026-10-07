import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedNumber } from "@/components/animated-number";
import { DayStrip } from "@/components/day-strip";
import { EmptyState } from "@/components/empty-state";
import { LocationMap, MapsOff } from "@/components/maps";
import { BatteryPanel } from "@/components/overview/battery-panel";
import { CarRender } from "@/components/overview/car-render";
import { LivePanel } from "@/components/overview/live-panel";
import { RecentCard } from "@/components/overview/recent-card";
import { Stat } from "@/components/overview/stat";
import { TireCard } from "@/components/overview/tire-card";
import { PageTransition } from "@/components/page-transition";
import { assessBatteryLevel, assessTirePressure } from "@/lib/assessment";
import { carImageUrl } from "@/lib/car-image";
import { requireCar } from "@/lib/car-route";
import { buildTimeline, dayWindow, localDayKey } from "@/lib/insights";
import { getLive } from "@/lib/live/live";
import { mapThemeOf } from "@/lib/preferences";
import { carSnapshot, recentCharges, recentDrives } from "@/lib/queries";
import { recentTireLeaks } from "@/lib/stats-data";
import { dayRecords } from "@/lib/timeline-data";
import { leakWarning } from "@/lib/tire-leak";
import { cn } from "@/lib/utils";
import {
  activityLabel,
  batteryCaption,
  batteryTone,
  carActivity,
  liveActivity,
  ongoingText,
  variantLine,
} from "@/lib/vehicle";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/cars/[carId]">): Promise<Metadata> {
  const car = await requireCar(params);
  return { title: car.name };
}

const toneDot = {
  active: "bg-primary",
  charge: "bg-charge",
  quiet: "bg-subtle",
};

export default async function OverviewPage({
  params,
}: PageProps<"/cars/[carId]">) {
  const [car, f, preferences] = await Promise.all([
    requireCar(params),
    getFormatter(),
    getPreferences(),
  ]);
  const now = new Date();
  const today = dayWindow(localDayKey(now, f.timeZone), f.timeZone);
  const [snapshot, [lastDrive], [lastCharge], todayRecords, live, leaks] =
    await Promise.all([
      carSnapshot(car.id),
      recentDrives(car, 1),
      recentCharges(car.id, 1),
      dayRecords(car.id, today.start, today.end),
      getLive(car.id),
      preferences.overview.tires
        ? recentTireLeaks(car.id, f.timeZone)
        : Promise.resolve([]),
    ]);
  const show = preferences.overview;
  const liveNow = live?.connected ? live.view : null;
  const chargingNow =
    liveNow?.charging.state === "Charging" ? liveNow.charging : null;
  const showLive = show.live && live !== null;
  const showMaps = preferences.maps === "show";
  const mapTheme = mapThemeOf(preferences);
  const todaySegments = buildTimeline({ ...todayRecords, ...today, now });
  const activity =
    liveActivity(liveNow?.state ?? null) ?? carActivity(snapshot);
  const { label, tone } = activityLabel(activity);
  const lastSeen = snapshot.positionAt ?? snapshot.stateSince;
  const charging = snapshot.charging || chargingNow !== null;
  const battery = batteryTone(snapshot.batteryLevel, charging);
  const hasData =
    snapshot.batteryLevel !== null || snapshot.positionAt !== null;
  const renderUrl = show.render ? carImageUrl(car) : null;
  const odometer = f.distanceValue(snapshot.odometerKm);
  const range = f.distanceValue(snapshot.rangeKm);
  const hasPosition = snapshot.latitude !== null && snapshot.longitude !== null;

  return (
    <PageTransition>
      <div className="overview-hero">
        <section className="hero-head pt-8 md:pt-14">
          <div className="hero-text">
            <p className="truncate text-sm text-muted-foreground">
              {variantLine(car)}
            </p>
            <h1 className="mt-1 truncate text-[40px] leading-[1.2] font-medium">
              {car.name}
            </h1>
            <p className="mt-3 flex min-w-0 items-center gap-2 text-sm">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  toneDot[tone],
                  tone !== "quiet" && "animate-pulse",
                )}
              />
              <span className="shrink-0 font-medium">{label}</span>
              <span className="truncate text-muted-foreground">
                · <span className="hidden sm:inline">Updated </span>
                {f.relative(lastSeen, now).toLowerCase()}
              </span>
            </p>
          </div>
          {renderUrl && (
            <div className="hero-car mx-auto -mt-2 w-full max-w-3xl md:-mt-6">
              <CarRender
                src={renderUrl}
                alt={`${car.name}, ${variantLine(car)}`}
              />
            </div>
          )}
        </section>
        {renderUrl && <div aria-hidden className="hero-spacer hidden" />}
      </div>

      {!hasData ? (
        <EmptyState title={`No data from ${car.name} yet`} className="mt-10">
          TeslaMate fills this page after {car.name} wakes up and sends its
          first position.
        </EmptyState>
      ) : (
        <>
          <section className="mt-10 md:mt-14">
            <BatteryPanel
              level={snapshot.batteryLevel}
              usableLevel={snapshot.usableBatteryLevel}
              range={range === null ? null : Math.round(range)}
              rangeUnit={f.units.distance}
              locale={f.locale}
              animated={preferences.motion !== "reduced"}
              tone={battery}
              caption={batteryCaption({
                level: snapshot.batteryLevel,
                usableLevel: snapshot.usableBatteryLevel,
                charging,
                limitPercent: chargingNow?.limitPercent,
              })}
              fullAt={chargingNow?.fullAt?.getTime() ?? null}
              renderedAt={now.getTime()}
              levelAssessment={assessBatteryLevel(
                snapshot.batteryLevel,
                charging,
              )}
            />
          </section>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            <Stat label="Odometer">
              <AnimatedNumber
                value={odometer === null ? null : Math.round(odometer)}
                suffix={` ${f.units.distance}`}
                locale={f.locale}
                animated={preferences.motion !== "reduced"}
              />
            </Stat>
            <Stat
              label="Outside"
              detail={
                snapshot.climateOn === null
                  ? undefined
                  : snapshot.climateOn
                    ? "Climate on"
                    : "Climate off"
              }
            >
              {f.temperature(snapshot.outsideTemp)}
            </Stat>
            <Stat label="Cabin">{f.temperature(snapshot.insideTemp)}</Stat>
            <Stat label="Software">{snapshot.softwareVersion ?? "—"}</Stat>
          </dl>

          {showLive && (
            <LivePanel
              carId={car.id}
              carName={car.name}
              feed={live}
              now={now}
              f={f}
              className="mt-12"
            />
          )}

          {show.today && (
            <section
              className={cn(
                "rounded-xl bg-card p-5",
                showLive ? "mt-4" : "mt-12",
              )}
            >
              <header className="flex items-center justify-between gap-4">
                <h2 className="text-sm text-muted-foreground">Today</h2>
                <Link
                  href={`/cars/${car.id}/timeline`}
                  transitionTypes={["tab-forward"]}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-tesla hover:text-foreground"
                >
                  Timeline
                  <ChevronRight className="size-4" />
                </Link>
              </header>
              <div className="mt-4">
                <DayStrip
                  segments={todaySegments}
                  start={today.start}
                  end={today.end}
                  now={now}
                  size="sm"
                  hourLabels={[0, 6, 12, 18, 24].map((hour) => f.hour(hour))}
                />
              </div>
            </section>
          )}

          {(show.tires || show.location) && (
            <div
              className={cn(
                "grid grid-cols-1 gap-4",
                show.today || showLive ? "mt-4" : "mt-12",
                show.tires && show.location && "md:grid-cols-2",
              )}
            >
              {show.tires && (
                <TireCard
                  tires={liveNow?.tires ?? snapshot.tires}
                  format={(bar) => f.pressure(bar)}
                  assess={(bar) => assessTirePressure(bar, f)}
                  warnings={leaks.map((leak) =>
                    leakWarning(leak, (bar) => f.pressure(bar)),
                  )}
                />
              )}
              {show.location && (
                <section className="flex flex-col overflow-hidden rounded-xl bg-card">
                  {hasPosition && (
                    <div className={show.tires ? "h-48" : "h-64"}>
                      {showMaps ? (
                        <LocationMap
                          latitude={snapshot.latitude ?? 0}
                          longitude={snapshot.longitude ?? 0}
                          theme={mapTheme}
                        />
                      ) : (
                        <MapsOff />
                      )}
                    </div>
                  )}
                  {hasPosition ? (
                    <div className="flex items-end justify-between gap-4 p-5">
                      <div className="min-w-0">
                        <h2 className="text-sm text-muted-foreground">
                          Location
                        </h2>
                        <p className="mt-1 truncate text-sm text-subtle tabular">
                          {lastSeen
                            ? `Last seen ${f.dayInline(lastSeen, now)} at ${f.clock(lastSeen)}`
                            : "Never seen"}
                        </p>
                      </div>
                      {showMaps && (
                        <a
                          href={`https://maps.apple.com/?ll=${snapshot.latitude},${snapshot.longitude}&q=${encodeURIComponent(car.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 shrink-0 items-center justify-center rounded bg-background px-5 text-sm font-medium text-secondary-foreground transition-tesla hover:bg-accent"
                        >
                          Open in Maps
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-5">
                      <h2 className="text-sm text-muted-foreground">
                        Location
                      </h2>
                      <p className="mt-3 text-sm text-subtle">
                        No position yet.
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {show.recent && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <RecentCard
                title="Last drive"
                href={`/cars/${car.id}/drives`}
                linkLabel="All drives"
              >
                {lastDrive ? (
                  <>
                    <p className="truncate text-lg font-medium">
                      {lastDrive.from} → {lastDrive.to}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground tabular">
                      {f.distance(lastDrive.distanceKm)} ·{" "}
                      {f.duration(lastDrive.durationMin)} ·{" "}
                      {f.day(lastDrive.startAt, now)}{" "}
                      {f.clock(lastDrive.startAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-subtle">No record yet.</p>
                )}
              </RecentCard>
              <RecentCard
                title="Last charge"
                href={`/cars/${car.id}/charging`}
                linkLabel="All charges"
              >
                {lastCharge ? (
                  <>
                    <p className="truncate text-lg font-medium">
                      {lastCharge.place}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground tabular">
                      {lastCharge.endAt
                        ? `+${f.energy(lastCharge.energyAddedKwh)} · ${lastCharge.startLevel ?? "—"}% → ${lastCharge.endLevel ?? "—"}%`
                        : `${ongoingText} since ${f.clock(lastCharge.startAt)}`}{" "}
                      · {f.day(lastCharge.startAt, now)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-subtle">No record yet.</p>
                )}
              </RecentCard>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
