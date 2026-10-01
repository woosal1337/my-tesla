import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { SeriesChart } from "@/components/charts/series-chart";
import { Metric } from "@/components/metric";
import { PageTransition } from "@/components/page-transition";
import { Panel, PanelNote } from "@/components/panel";
import { PeriodLinks } from "@/components/period-links";
import { WeekHeatmap } from "@/components/week-heatmap";
import { requireCar } from "@/lib/car-route";
import {
  chargeStarts,
  chargeTypeTotals,
  dcCurves,
  type ChargeTypeTotals,
} from "@/lib/charge-insights-data";
import { costPer100Km, costPerKwh, curveRows } from "@/lib/charge-insights";
import type { Formatter } from "@/lib/format";
import { periodStart, readPeriod, weekGrid } from "@/lib/insights";
import { chargingPlaces } from "@/lib/places-data";
import { driveTotals } from "@/lib/stats-data";
import { cn } from "@/lib/utils";
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
        {totals?.sessions ?? 0} sessions
        {perKwh !== null && ` · ${f.cost(perKwh)} per kWh`}
      </p>
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
  const [types, starts, curves, places, drives] = await Promise.all([
    chargeTypeTotals(car.id, from),
    chargeStarts(car.id, from, f.timeZone),
    dcCurves(car.id, from),
    chargingPlaces(car.id, from),
    driveTotals(car.id, from),
  ]);
  const ac = types.find((type) => !type.fast);
  const dc = types.find((type) => type.fast);
  const sessions = types.reduce((sum, type) => sum + type.sessions, 0);
  const addedKwh = types.reduce((sum, type) => sum + type.addedKwh, 0);
  const costs = types
    .map((type) => type.cost)
    .filter((cost): cost is number => cost !== null);
  const cost = costs.length
    ? costs.reduce((sum, value) => sum + value, 0)
    : null;
  const costedKwh = types.reduce((sum, type) => sum + type.costedKwh, 0);
  const perKwh = costPerKwh(cost, costedKwh);
  const perDistance = costPer100Km(cost, drives.distanceKm);
  const hundred = f.units.distance === "mi" ? 160.9344 : 100;
  const curveData = curveRows(curves);
  const grid = weekGrid(starts);

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <BackLink href={`/cars/${car.id}/charging`} label="Charging" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[40px] leading-[1.2] font-medium">
            Charging insights
          </h1>
          <PeriodLinks
            base={`/cars/${car.id}/charging/insights`}
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
                    label: f.date(key.startAt),
                    color: curveColors[index % curveColors.length],
                    unit: "kW",
                  }))}
                  yDomain={[0, "auto"]}
                />
              ) : (
                <PanelNote>No DC fast charge in this period.</PanelNote>
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
                          className="flex items-center justify-between gap-4 rounded px-2 py-2.5"
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium">
                                {place.label}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                                  place.fast
                                    ? "bg-primary/15 text-primary"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {place.fast ? "DC" : "AC"}
                              </span>
                            </span>
                            <span className="block text-sm text-subtle tabular">
                              {place.sessions} sessions
                              {placePerKwh !== null &&
                                ` · ${f.cost(placePerKwh)} per kWh`}
                            </span>
                          </span>
                          <span className="shrink-0 text-right tabular">
                            <span className="block font-medium">
                              {f.energy(place.addedKwh)}
                            </span>
                            <span className="block text-sm text-subtle">
                              {place.cost === null ? "" : f.cost(place.cost)}
                            </span>
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
