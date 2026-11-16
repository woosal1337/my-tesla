import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { ChargerBadge } from "@/components/charger-badge";
import { SeriesChart } from "@/components/charts/series-chart";
import { Metric } from "@/components/metric";
import { PageTransition } from "@/components/page-transition";
import { Panel, PanelNote } from "@/components/panel";
import { PeriodLinks } from "@/components/period-links";
import { WeekHeatmap } from "@/components/week-heatmap";
import { requireCar } from "@/lib/car-route";
import { carPath } from "@/lib/car-slug";
import {
  chargeLevelTimes,
  chargeStarts,
  chargeTypeTotals,
  dcCurves,
  type ChargeTypeTotals,
} from "@/lib/charge-insights-data";
import {
  chargeInsightTotals,
  costPerKwh,
  curveLabels,
  curveRows,
} from "@/lib/charge-insights";
import {
  chargeHistory,
  chargeLegs,
  chargeTime,
  type ChargeLeg,
  type LevelTime,
} from "@/lib/charge-time";
import type { Formatter } from "@/lib/format";
import { periodStart, readPeriod, weekGrid } from "@/lib/insights";
import { chargingPlaces } from "@/lib/places-data";
import { carSnapshot } from "@/lib/queries";
import { driveTotals } from "@/lib/stats-data";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Charging insights" };

const curveColors = [
  "var(--charge)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--primary)",
];

function TypeCard({
  label,
  totals,
  f,
}: {
  label: string;
  totals: ChargeTypeTotals | undefined;
  f: Formatter;
}) {
  const perKwh = totals ? costPerKwh(totals.cost, totals.costedKwh) : null;
  return (
    <div className="rounded-xl bg-card p-5">
      <h2 className="text-sm text-muted-foreground">{label}</h2>
      <p className="mt-2 text-2xl font-medium tabular">
        {f.energy(totals?.addedKwh ?? 0)}
      </p>
      <p className="mt-1 text-sm text-subtle tabular">
        {totals?.sessions ?? 0}{" "}
        {totals?.sessions === 1 ? "session" : "sessions"}
        {totals && totals.cost !== null && ` · ${f.cost(totals.cost)}`}
        {perKwh !== null && ` · ${f.cost(perKwh)} per kWh`}
      </p>
    </div>
  );
}

function ChargeTimes({
  label,
  fast,
  levels,
  legs,
  f,
}: {
  label: string;
  fast: boolean;
  levels: LevelTime[];
  legs: ChargeLeg[];
  f: Formatter;
}) {
  const history = chargeHistory(levels, fast);
  if (!history) return null;
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-medium">{label}</h3>
      <p className="mt-0.5 text-xs text-subtle tabular">
        {history.sessions} {history.sessions === 1 ? "charge" : "charges"} ·{" "}
        {history.from}% to {history.to}%
      </p>
      <ul className="mt-3 divide-y divide-border">
        {legs.map((leg) => {
          const time = chargeTime(levels, fast, leg);
          return (
            <li
              key={`${leg.from}-${leg.to}`}
              className="flex items-start justify-between gap-4 py-2.5 text-sm tabular"
            >
              <span className="whitespace-nowrap">
                {leg.from}% → {leg.to}%
                {leg.current && (
                  <span className="block text-xs text-subtle">
                    From the level now
                  </span>
                )}
              </span>
              {time ? (
                <span className="text-right whitespace-nowrap">
                  <span className="block font-medium">
                    {f.duration(time.typicalMin)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Slow {f.duration(time.slowMin)}
                  </span>
                </span>
              ) : (
                <span className="text-subtle">No record</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function ChargingInsightsPage({
  params,
  searchParams,
}: PageProps<"/cars/[carId]/charging/insights">) {
  const [car, f, preferences, query] = await Promise.all([
    requireCar(params),
    getFormatter(),
    getPreferences(),
    searchParams,
  ]);
  const now = new Date();
  const period = readPeriod(
    typeof query.period === "string" ? query.period : undefined,
    preferences.period,
  );
  const from = periodStart(period, now);
  const [types, starts, curves, places, drives, levelTimes, snapshot] =
    await Promise.all([
      chargeTypeTotals(car.id, from),
      chargeStarts(car.id, from, f.timeZone),
      dcCurves(car.id, from),
      chargingPlaces(car.id, from),
      driveTotals(car.id, from),
      chargeLevelTimes(car.id),
      carSnapshot(car.id),
    ]);
  const {
    ac,
    dc,
    sessions,
    addedKwh,
    cost,
    perKwh,
    perKm: perDistance,
  } = chargeInsightTotals(types, drives.distanceKm);
  const hundred = f.units.distance === "mi" ? 160.9344 : 100;
  const curveData = curveRows(curves);
  const curveNames = curveLabels(curveData.keys, f.date, f.clock);
  const grid = weekGrid(starts);
  const legs = chargeLegs(snapshot.batteryLevel);

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <BackLink href={carPath(car, "/charging")} label="Charging" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[40px] leading-[1.2] font-medium">
            Charging insights
          </h1>
          <PeriodLinks
            base={carPath(car, "/charging/insights")}
            active={period}
          />
        </div>
      </div>

      {sessions === 0 ? (
        <p className="mt-10 text-sm text-subtle">No charge in this period.</p>
      ) : (
        <>
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            <Metric size="lg" label="Sessions" value={sessions} />
            <Metric
              size="lg"
              label="Energy added"
              value={f.number(addedKwh, 0)}
              unit="kWh"
            />
            <Metric
              size="lg"
              label="Cost per kWh"
              value={perKwh === null ? "—" : f.cost(perKwh)}
              detail={cost === null ? undefined : `${f.cost(cost)} in total`}
            />
            <Metric
              size="lg"
              label={`Cost per 100 ${f.units.distance}`}
              value={
                perDistance === null
                  ? "—"
                  : f.cost((perDistance * hundred) / 100)
              }
              detail={`${f.distance(drives.distanceKm)} driven`}
            />
          </dl>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            <TypeCard label="AC charging" totals={ac} f={f} />
            <TypeCard label="DC fast charging" totals={dc} f={f} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Panel title="DC charging curves (kW)">
              {curveData.keys.length ? (
                <SeriesChart
                  data={curveData.rows}
                  xKey="level"
                  xFormat="percent"
                  chartStyle={f.chartStyle}
                  series={curveData.keys.map((key, index) => ({
                    key: key.key,
                    label: curveNames[index]!,
                    color: curveColors[index % curveColors.length],
                    unit: "kW",
                  }))}
                  yDomain={[0, "auto"]}
                />
              ) : (
                <PanelNote>No DC fast charge in this period.</PanelNote>
              )}
            </Panel>
            <Panel
              title="Charging time"
              action={
                <span className="text-xs text-subtle">
                  Charges of the last 2 years
                </span>
              }
            >
              {levelTimes.length ? (
                <>
                  <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
                    <ChargeTimes
                      label="DC fast charging"
                      fast
                      levels={levelTimes}
                      legs={legs}
                      f={f}
                    />
                    <ChargeTimes
                      label="AC charging"
                      fast={false}
                      levels={levelTimes}
                      legs={legs}
                      f={f}
                    />
                  </div>
                  <p className="mt-5 text-xs text-subtle">
                    The time that past charges spent at each battery percent.
                    The slow time fits a cold battery or a busy charger.
                  </p>
                </>
              ) : (
                <PanelNote>No record yet.</PanelNote>
              )}
            </Panel>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel
                title="When the car charges"
                action={
                  <span className="text-xs text-subtle">Charge starts</span>
                }
              >
                <WeekHeatmap
                  grid={grid}
                  sundayFirst={preferences.weekStart === "sunday"}
                  hourLabel={(hour) => f.hour(hour)}
                />
              </Panel>
              <Panel title="Top charging places">
                {places.length ? (
                  <ol className="-mx-2">
                    {places.map((place) => {
                      const placePerKwh = costPerKwh(
                        place.cost,
                        place.addedKwh,
                      );
                      return (
                        <li
                          key={place.key}
                          className="flex items-start justify-between gap-4 rounded px-2 py-2.5"
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium">
                                {place.label}
                              </span>
                              <ChargerBadge fast={place.fast} />
                            </span>
                            <span className="block text-sm text-subtle tabular">
                              {place.sessions}{" "}
                              {place.sessions === 1 ? "session" : "sessions"}
                              {placePerKwh !== null &&
                                ` · ${f.cost(placePerKwh)} per kWh`}
                            </span>
                          </span>
                          <span className="shrink-0 text-right tabular">
                            <span className="block font-medium">
                              {f.energy(place.addedKwh)}
                            </span>
                            {place.cost !== null && (
                              <span className="block text-sm text-subtle">
                                {f.cost(place.cost)}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <PanelNote>No charging place yet.</PanelNote>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
}
