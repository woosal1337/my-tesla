import { CalendarDays, ChevronRight } from "lucide-react";
import { CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { niceDomain } from "@/components/charts/nice-domain";
import { ScatterPoints } from "@/components/charts/scatter-points";
import { SeriesChart } from "@/components/charts/series-chart";
import { PageTransition } from "@/components/page-transition";
import { Panel, PanelNote } from "@/components/panel";
import { PeriodLinks } from "@/components/period-links";
import { StatsTotals } from "@/components/stats-totals";
import { WeekHeatmap } from "@/components/week-heatmap";
import { requireCar } from "@/lib/car-route";
import { carPath } from "@/lib/car-slug";
import {
  bucketUnit,
  periodStart,
  periods,
  readPeriod,
  weekGrid,
} from "@/lib/insights";
import {
  driveStarts,
  driveTotals,
  efficiencyPoints,
  longestDrives,
  odometerTrend,
  periodChargeTotals,
  pressureTrend,
  softwareUpdates,
  statsBuckets,
  speedBandRows,
  recentTireLeaks,
} from "@/lib/stats-data";
import {
  bucketRows,
  efficiencyBands,
  efficiencyScatter,
  pressureRows,
  updateDays,
} from "@/lib/stats-figures";
import { odometerRows } from "@/lib/trends";
import { efficiencyDigits } from "@/lib/units";
import { speedBands, speedEdges } from "@/lib/speed-bands";
import { leakWarning } from "@/lib/tire-leak";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Stats" };

const colors = {
  distance: "var(--chart-1)",
  odometer: "var(--chart-1)",
  used: "var(--chart-1)",
  charged: "var(--charge)",
  cost: "var(--charge)",
  outside: "var(--chart-1)",
  cabin: "var(--chart-4)",
  efficiency: "var(--chart-1)",
  frontLeft: "var(--chart-1)",
  frontRight: "var(--chart-3)",
  rearLeft: "var(--chart-4)",
  rearRight: "var(--charge)",
};

export default async function StatsPage({
  params,
  searchParams,
}: PageProps<"/cars/[carId]/stats">) {
  const [car, query, f, preferences] = await Promise.all([
    requireCar(params),
    searchParams,
    getFormatter(),
    getPreferences(),
  ]);
  const now = new Date();
  const timeZone = f.timeZone;
  const sundayFirst = preferences.weekStart === "sunday";
  const period = readPeriod(
    typeof query.period === "string" ? query.period : undefined,
    preferences.period,
  );
  const from = periodStart(period, now);
  const edges = speedEdges(preferences.distance);
  const unit = bucketUnit(period);
  const [
    buckets,
    drives,
    charges,
    efficiency,
    starts,
    pressure,
    updates,
    longest,
    speedRows,
    leaks,
    odometer,
  ] = await Promise.all([
    statsBuckets(car.id, from, unit, timeZone, sundayFirst),
    driveTotals(car.id, from),
    periodChargeTotals(car.id, from),
    efficiencyPoints(car.id, from),
    driveStarts(car.id, from, timeZone),
    pressureTrend(car.id, from, unit === "month" ? "week" : "day", timeZone),
    softwareUpdates(car.id),
    longestDrives(car.id, from),
    speedBandRows(car.id, from, edges.kmh),
    recentTireLeaks(car.id, timeZone),
    odometerTrend(car.id, from),
  ]);

  const speeds = speedBands(speedRows, edges.shown);
  const bands = efficiencyBands(efficiency, f, preferences.temperature === "f");
  const grid = weekGrid(starts);
  const series = bucketRows(buckets, f);
  const temperatures = series.flatMap((bucket) =>
    [bucket.outside, bucket.cabin].filter(
      (value): value is number => value !== null,
    ),
  );
  const odometerSeries = odometerRows(odometer, f);
  const pressureSeries = pressureRows(pressure, f);
  const pressureValues = pressureSeries.flatMap((point) =>
    [point.frontLeft, point.frontRight, point.rearLeft, point.rearRight].filter(
      (value): value is number => value !== null,
    ),
  );
  const pressureTooltipDigits = { bar: 2, psi: 1, kpa: 0 }[
    preferences.pressure
  ];
  const scatter = efficiencyScatter(efficiency, f);
  const periodLabel =
    periods.find((candidate) => candidate.id === period)?.label ?? "";
  const bucketLabel = { day: "day", week: "week", month: "month" }[unit];
  const xFormat = unit === "month" ? "month" : "day";

  return (
    <PageTransition>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-6 md:pt-10">
        <div>
          <p className="text-sm text-muted-foreground">
            {period === "all" ? "All records" : `Last ${periodLabel}`}
          </p>
          <h1 className="mt-1 text-[32px] leading-[1.2] font-medium md:text-[40px]">
            Stats
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={carPath(car, "/stats/year")}
            transitionTypes={["tab-forward"]}
            className="inline-flex h-9 items-center gap-2 rounded bg-card px-3 text-sm font-medium transition-tesla hover:bg-accent"
          >
            <CalendarDays aria-hidden className="size-4" />
            Year in review
          </Link>
          <PeriodLinks base={carPath(car, "/stats")} active={period} />
        </div>
      </div>

      <StatsTotals car={car} drives={drives} charges={charges} f={f} />

      <div className="mt-12 grid grid-cols-1 gap-4">
        <Panel
          title={`Distance (${f.units.distance})`}
          action={
            <span className="text-xs text-subtle">Per {bucketLabel}</span>
          }
        >
          {drives.drives ? (
            <SeriesChart
              data={series}
              xKey="at"
              xFormat={xFormat}
              chartStyle={f.chartStyle}
              series={[
                {
                  key: "distance",
                  label: "Distance",
                  color: colors.distance,
                  unit: f.units.distance,
                  digits: 1,
                  kind: "bar",
                },
              ]}
              yDomain={[0, "auto"]}
              height={240}
            />
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </Panel>

        <Panel title={`Odometer (${f.units.distance})`}>
          {odometerSeries.length > 1 ? (
            <SeriesChart
              data={odometerSeries}
              xKey="at"
              xFormat="day"
              chartStyle={f.chartStyle}
              series={[
                {
                  key: "odometer",
                  label: "Odometer",
                  color: colors.odometer,
                  unit: f.units.distance,
                  kind: "area",
                },
              ]}
              yDomain={niceDomain(
                odometerSeries.map((point) => point.odometer),
              )}
              height={220}
            />
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </Panel>

        <Panel
          title="Energy (kWh)"
          action={
            <span className="text-xs text-subtle">Per {bucketLabel}</span>
          }
        >
          {drives.drives || charges.sessions ? (
            <SeriesChart
              data={series}
              xKey="at"
              xFormat={xFormat}
              chartStyle={f.chartStyle}
              series={[
                {
                  key: "used",
                  label: "Used",
                  color: colors.used,
                  unit: "kWh",
                  digits: 1,
                  kind: "bar",
                },
                {
                  key: "charged",
                  label: "Charged",
                  color: colors.charged,
                  unit: "kWh",
                  digits: 1,
                  kind: "bar",
                },
              ]}
              yDomain={[0, "auto"]}
              height={240}
            />
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </Panel>

        {charges.cost !== null && (
          <Panel
            title={
              preferences.currency === "none"
                ? "Charging cost"
                : `Charging cost (${preferences.currency})`
            }
            action={
              <span className="text-xs text-subtle">
                {[
                  `Per ${bucketLabel}`,
                  charges.estimatedCosts
                    ? `${charges.estimatedCosts} of ${charges.sessions} charges from your price`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            }
          >
            <SeriesChart
              data={series}
              xKey="at"
              xFormat={xFormat}
              chartStyle={f.chartStyle}
              series={[
                {
                  key: "cost",
                  label: "Cost",
                  color: colors.cost,
                  digits: 2,
                  kind: "bar",
                },
              ]}
              yDomain={[0, "auto"]}
              height={220}
            />
          </Panel>
        )}

        <Panel
          title={`Temperature (${f.units.temperature})`}
          action={
            <span className="text-xs text-subtle">
              Average while driving, per {bucketLabel}
            </span>
          }
        >
          {temperatures.length ? (
            <SeriesChart
              data={series}
              xKey="at"
              xFormat={xFormat}
              chartStyle={f.chartStyle}
              series={[
                {
                  key: "outside",
                  label: "Outside",
                  color: colors.outside,
                  unit: f.units.temperature,
                  digits: 1,
                },
                {
                  key: "cabin",
                  label: "Cabin",
                  color: colors.cabin,
                  unit: f.units.temperature,
                  digits: 1,
                },
              ]}
              yDomain={niceDomain(temperatures)}
              height={220}
            />
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title={`Efficiency (${f.units.efficiency}) and temperature`}
            className="lg:col-span-2"
          >
            {scatter.length > 2 ? (
              <ScatterPoints
                points={scatter}
                xLabel="Outside"
                xUnit={f.units.temperature}
                yLabel="Efficiency"
                yUnit={f.units.efficiency}
                yDigits={efficiencyDigits(preferences)}
                locale={f.locale}
                animate={f.chartStyle.animate}
                color={colors.efficiency}
              />
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
          <Panel
            title="By temperature"
            action={
              bands.length ? (
                <span className="text-xs text-subtle">Share of distance</span>
              ) : undefined
            }
          >
            {bands.length ? (
              <ul className="space-y-4">
                {bands.map((band) => (
                  <li key={band.from}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="tabular">
                        {band.from} to {band.to} {f.units.temperature}
                      </span>
                      <span className="text-muted-foreground tabular">
                        {f.distance(band.distanceKm)} ·{" "}
                        <span className="text-foreground">
                          {f.efficiency(band.whPerKm)}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-tesla starting:w-0!"
                        style={{
                          width: `${band.share * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
          <Panel
            title="By speed"
            action={
              speeds.length ? (
                <span className="text-xs text-subtle">
                  Share of driving time
                </span>
              ) : undefined
            }
          >
            {speeds.length ? (
              <ul className="space-y-4">
                {speeds.map((band) => (
                  <li key={band.from}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="tabular">
                        {band.to === null
                          ? `${band.from}+ ${f.units.speed}`
                          : `${band.from} to ${band.to} ${f.units.speed}`}
                      </span>
                      <span className="text-muted-foreground tabular">
                        {Math.round(band.share * 100)}% ·{" "}
                        <span className="text-foreground">
                          {f.efficiency(band.whPerKm)}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-tesla starting:w-0!"
                        style={{
                          width: `${band.share * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="When the car drives"
            action={
              drives.drives ? (
                <span className="text-xs text-subtle">Drive starts</span>
              ) : undefined
            }
          >
            {drives.drives ? (
              <WeekHeatmap
                grid={grid}
                sundayFirst={sundayFirst}
                hourLabel={(hour) => f.hour(hour)}
              />
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
          <Panel title="Longest drives">
            {longest.length ? (
              <ol className="-mx-2">
                {longest.map((drive, index) => (
                  <li key={drive.id}>
                    <Link
                      href={carPath(car, `/drives/${drive.id}`)}
                      transitionTypes={["tab-forward"]}
                      className="flex items-center gap-4 rounded px-2 py-2.5 transition-tesla hover:bg-accent"
                    >
                      <span className="w-4 text-sm text-subtle tabular">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {drive.from} → {drive.to}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular">
                          {f.day(drive.startAt, now)} ·{" "}
                          {f.duration(drive.durationMin)}
                        </span>
                      </span>
                      <span className="text-sm font-medium tabular">
                        {f.distance(drive.distanceKm)}
                      </span>
                      <ChevronRight className="size-4 text-subtle" />
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title={`Tire pressure (${f.units.pressure})`}>
            {pressureSeries.length > 1 ? (
              <SeriesChart
                data={pressureSeries}
                xKey="at"
                xFormat="day"
                chartStyle={f.chartStyle}
                series={[
                  {
                    key: "frontLeft",
                    label: "Front left",
                    color: colors.frontLeft,
                    unit: f.units.pressure,
                    digits: pressureTooltipDigits,
                  },
                  {
                    key: "frontRight",
                    label: "Front right",
                    color: colors.frontRight,
                    unit: f.units.pressure,
                    digits: pressureTooltipDigits,
                  },
                  {
                    key: "rearLeft",
                    label: "Rear left",
                    color: colors.rearLeft,
                    unit: f.units.pressure,
                    digits: pressureTooltipDigits,
                  },
                  {
                    key: "rearRight",
                    label: "Rear right",
                    color: colors.rearRight,
                    unit: f.units.pressure,
                    digits: pressureTooltipDigits,
                  },
                ]}
                yDomain={niceDomain(pressureValues)}
              />
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
            {leaks.map((leak) => (
              <p
                key={leak.tire}
                className="mt-4 flex items-start gap-2 text-sm"
              >
                <CircleAlert
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-warning"
                />
                {leakWarning(leak, (bar) => f.pressure(bar))}
              </p>
            ))}
          </Panel>
          <Panel title="Software">
            {updates.length ? (
              <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[3px] before:w-px before:bg-border">
                {updateDays(updates, now).map(({ update, days }, index) => {
                  return (
                    <li
                      key={update.startAt.getTime()}
                      className="relative pl-6"
                    >
                      <span
                        className={
                          index === 0
                            ? "absolute top-1.5 left-0 size-[7px] rounded-full bg-primary"
                            : "absolute top-1.5 left-0 size-[7px] rounded-full bg-subtle"
                        }
                      />
                      <p className="flex items-baseline justify-between gap-4">
                        <span className="font-medium tabular">
                          {update.version}
                        </span>
                        <span className="text-xs text-subtle">
                          {index === 0 ? "Current · " : ""}
                          {days} {days === 1 ? "day" : "days"}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground tabular">
                        {f.day(update.startAt, now)}
                        {update.endAt
                          ? ` · ${f.duration((update.endAt.getTime() - update.startAt.getTime()) / 60_000)} to install`
                          : ""}
                      </p>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
        </div>
      </div>
    </PageTransition>
  );
}
