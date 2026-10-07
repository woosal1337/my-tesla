import type { Metadata } from "next";
import { niceDomain } from "@/components/charts/nice-domain";
import { SeriesChart } from "@/components/charts/series-chart";
import { Metric } from "@/components/metric";
import { PageTransition } from "@/components/page-transition";
import { Panel, PanelNote } from "@/components/panel";
import { PeriodLinks } from "@/components/period-links";
import {
  batteryNow,
  capacityHistory,
  chargeLevels,
  chargeTotals,
  idlePeriods,
  levelTime,
  longChargeKwh,
} from "@/lib/battery-data";
import {
  assessAsleep,
  assessBatteryHealth,
  assessChargingEfficiency,
  assessIdleLoss,
  assessIdlePower,
  assessmentTitle,
  toneClass,
} from "@/lib/assessment";
import { requireCar } from "@/lib/car-route";
import type { Formatter } from "@/lib/format";
import {
  batteryCapacity,
  drainRate,
  healthCharges,
  levelHistogram,
  levelShares,
  median,
  periodStart,
  periods,
  readPeriod,
  type IdlePeriod,
} from "@/lib/insights";
import { cn } from "@/lib/utils";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Battery" };

const colors = {
  capacity: "var(--chart-1)",
  range: "var(--chart-1)",
  start: "var(--chart-3)",
  end: "var(--charge)",
};

function HealthBar({
  now,
  best,
  f,
}: {
  now: number;
  best: number;
  f: Formatter;
}) {
  return (
    <div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700 ease-tesla starting:w-0!"
          style={{ width: `${Math.min(100, (now / best) * 100)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-subtle tabular">
        <span>0 kWh</span>
        <span>
          {f.number(now, 1)} of {f.number(best, 1)} kWh
        </span>
      </div>
    </div>
  );
}

function missingChargesText(
  missing: number,
  minimumKwh: number | null,
  f: Formatter,
): string {
  const count = missing < healthCharges ? `${missing} more` : `${missing}`;
  const charges = missing === 1 ? "charge" : "charges";
  return minimumKwh === null
    ? `Needs ${count} long ${charges}`
    : `Needs ${count} ${charges} of ${f.number(Math.ceil(minimumKwh))} kWh or more`;
}

function ShareRow({
  label,
  share,
  detail,
  tone = "bg-primary",
}: {
  label: string;
  share: number;
  detail?: string;
  tone?: string;
}) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular">
          {detail ? `${detail} · ` : ""}
          {Math.round(share * 100)}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone} transition-[width] duration-700 ease-tesla starting:w-0!`}
          style={{ width: `${share * 100}%` }}
        />
      </div>
    </li>
  );
}

function IdleRow({
  period,
  f,
  now,
}: {
  period: IdlePeriod;
  f: Formatter;
  now: Date;
}) {
  const hours = period.durationS / 3600;
  const watts =
    period.energyKwh === null ? null : (period.energyKwh / hours) * 1000;
  const power = assessIdlePower(watts, f);
  return (
    <tr className="border-t border-border">
      <td className="py-3 pr-4">
        <span className="block">
          {f.day(period.start, now)}{" "}
          <span className="text-muted-foreground">{f.clock(period.start)}</span>
        </span>
        <span className="block text-xs text-subtle sm:hidden">
          {f.duration(period.durationS / 60)} ·{" "}
          {Math.round(period.standby * 100)}% asleep
        </span>
      </td>
      <td className="hidden py-3 pr-4 text-right text-muted-foreground sm:table-cell">
        {f.duration(period.durationS / 60)}
      </td>
      <td className="hidden py-3 pr-4 text-right text-muted-foreground sm:table-cell">
        {Math.round(period.standby * 100)}%
      </td>
      <td className="py-3 pr-4 text-right">
        {period.rangeLostKm === null
          ? "—"
          : `${f.number(f.distanceValue(period.rangeLostKm) ?? 0, 1)} ${f.units.distance}`}
      </td>
      <td
        className={cn(
          "py-3 text-right text-muted-foreground",
          power && toneClass[power.tone],
        )}
        title={power ? assessmentTitle(power) : undefined}
      >
        {watts === null ? "—" : `${f.number(watts)} W`}
      </td>
    </tr>
  );
}

export default async function BatteryPage({
  params,
  searchParams,
}: PageProps<"/cars/[carId]/battery">) {
  const [car, query, f, preferences] = await Promise.all([
    requireCar(params),
    searchParams,
    getFormatter(),
    getPreferences(),
  ]);
  const now = new Date();
  const period = readPeriod(
    typeof query.period === "string" ? query.period : undefined,
    preferences.period,
  );
  const from = periodStart(period, now);
  const [capacity, latest, totals, levels, charges, idle, minimumKwh] =
    await Promise.all([
      capacityHistory(car.id),
      batteryNow(car.id),
      chargeTotals(car.id),
      levelTime(car.id, from),
      chargeLevels(car.id, from),
      idlePeriods(car.id, from),
      longChargeKwh(car.id),
    ]);

  const estimate = batteryCapacity(capacity);
  const health = estimate?.healthPercent ?? null;
  const bestRange = capacity.length
    ? Math.max(...capacity.map((point) => point.rangeKm))
    : null;
  const rangeNow =
    median(capacity.slice(-5).map((point) => point.rangeKm)) ??
    latest.rangeAt100Km;
  const cycles = estimate ? totals.addedKwh / estimate.bestKwh : null;
  const efficiency = totals.usedKwh ? totals.addedKwh / totals.usedKwh : null;
  const shares = levelShares(
    levels.map((row) => ({ level: row.level, weightMs: row.seconds * 1000 })),
  );
  const trackedHours = levels.reduce((sum, row) => sum + row.seconds, 0) / 3600;
  const startBuckets = levelHistogram(charges.map((row) => row.startLevel));
  const endBuckets = levelHistogram(charges.map((row) => row.endLevel));
  const histogram = startBuckets.map((bucket, index) => ({
    level: bucket.level,
    start: bucket.count,
    end: endBuckets[index].count,
  }));
  const drain = drainRate(idle);
  const capacitySeries = capacity.map((point) => ({
    at: point.at.getTime(),
    kwh: Math.round(point.kwh * 10) / 10,
    range: Math.round(f.distanceValue(point.rangeKm) ?? 0),
  }));
  const periodLabel =
    periods.find((candidate) => candidate.id === period)?.label ?? "";
  const totalCharged = totals.acKwh + totals.dcKwh;

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <p className="text-sm text-muted-foreground">{car.name}</p>
        <h1 className="mt-1 text-[32px] leading-[1.2] font-medium md:text-[40px]">
          Battery
        </h1>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Metric
          size="lg"
          label="Health"
          value={health === null ? "—" : f.number(health, 1)}
          unit="%"
          assessment={assessBatteryHealth(
            health,
            capacity.at(-1)?.odometerKm ?? null,
            f,
          )}
          detail={
            health === null
              ? missingChargesText(
                  estimate?.missingCharges ?? healthCharges,
                  minimumKwh,
                  f,
                )
              : `From ${capacity.length} charges`
          }
        />
        <Metric
          size="lg"
          label="Capacity now"
          value={estimate ? f.number(estimate.nowKwh, 1) : "—"}
          unit="kWh"
          detail={
            estimate ? `Best ${f.number(estimate.bestKwh, 1)} kWh` : undefined
          }
        />
        <Metric
          size="lg"
          label="Range at 100%"
          value={
            rangeNow === null
              ? "—"
              : f.number(Math.round(f.distanceValue(rangeNow) ?? 0))
          }
          unit={f.units.distance}
          detail={bestRange ? `Best ${f.distance(bestRange)}` : undefined}
        />
        <Metric
          size="lg"
          label="Charge cycles"
          value={cycles === null ? "—" : f.number(cycles, 1)}
          detail={`${f.number(totals.addedKwh)} kWh added`}
        />
      </dl>

      {estimate && health !== null && (
        <div className="mt-10">
          <HealthBar now={estimate.nowKwh} best={estimate.bestKwh} f={f} />
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-4">
        <Panel
          title="Capacity"
          action={
            <span className="text-xs text-subtle">
              Estimated after each long charge
            </span>
          }
        >
          {capacitySeries.length > 1 ? (
            <SeriesChart
              data={capacitySeries}
              xKey="at"
              xFormat="day"
              chartStyle={f.chartStyle}
              series={[
                {
                  key: "kwh",
                  label: "Capacity",
                  color: colors.capacity,
                  unit: "kWh",
                  digits: 1,
                  kind: "area",
                },
              ]}
              yDomain={niceDomain(capacitySeries.map((point) => point.kwh))}
              height={260}
            />
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Range at 100%">
            {capacitySeries.length > 1 ? (
              <SeriesChart
                data={capacitySeries}
                xKey="at"
                xFormat="day"
                chartStyle={f.chartStyle}
                series={[
                  {
                    key: "range",
                    label: "Range",
                    color: colors.range,
                    unit: f.units.distance,
                  },
                ]}
                yDomain={niceDomain(capacitySeries.map((point) => point.range))}
              />
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
          <Panel title="Charging energy">
            {totals.sessions ? (
              <div className="flex h-full flex-col justify-between gap-8">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-6">
                  <Metric
                    label="Added"
                    value={f.number(totals.addedKwh)}
                    unit="kWh"
                    detail={`${totals.sessions} sessions`}
                  />
                  <Metric
                    label="Efficiency"
                    value={
                      efficiency === null ? "—" : Math.round(efficiency * 100)
                    }
                    unit="%"
                    assessment={assessChargingEfficiency(
                      efficiency === null ? null : efficiency * 100,
                      totals.dcKwh > totals.acKwh,
                    )}
                    detail={`${f.number(totals.usedKwh)} kWh from chargers`}
                  />
                </dl>
                <ul className="space-y-4">
                  <ShareRow
                    label="AC"
                    share={totalCharged ? totals.acKwh / totalCharged : 0}
                    detail={`${f.number(totals.acKwh)} kWh`}
                    tone="bg-charge"
                  />
                  <ShareRow
                    label="DC fast"
                    share={totalCharged ? totals.dcKwh / totalCharged : 0}
                    detail={`${f.number(totals.dcKwh)} kWh`}
                  />
                </ul>
              </div>
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-14 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium">Habits</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {period === "all" ? "All records" : `Last ${periodLabel}`}
          </p>
        </div>
        <PeriodLinks base={`/cars/${car.id}/battery`} active={period} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="Time at each level"
            action={
              trackedHours ? (
                <span className="text-xs text-subtle tabular">
                  {f.number(trackedHours)} h recorded
                </span>
              ) : undefined
            }
          >
            {trackedHours ? (
              <ul className="space-y-4">
                {[...shares].reverse().map((band) => (
                  <ShareRow
                    key={band.id}
                    label={band.label}
                    share={band.share}
                  />
                ))}
              </ul>
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
          <Panel
            title="Charge start and end levels"
            action={
              charges.length ? (
                <span className="text-xs text-subtle tabular">
                  {charges.length} charges
                </span>
              ) : undefined
            }
          >
            {charges.length ? (
              <SeriesChart
                data={histogram}
                xKey="level"
                xFormat="percent"
                chartStyle={f.chartStyle}
                series={[
                  {
                    key: "start",
                    label: "Start",
                    color: colors.start,
                    kind: "bar",
                  },
                  {
                    key: "end",
                    label: "End",
                    color: colors.end,
                    kind: "bar",
                  },
                ]}
                yDomain={[0, "auto"]}
              />
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
        </div>

        <Panel
          title="Idle drain"
          action={
            <span className="text-xs text-subtle">
              Parked for 6 hours or more
            </span>
          }
        >
          {drain ? (
            <>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
                <Metric
                  label="Range lost"
                  value={f.number(f.distanceValue(drain.kmPerDay) ?? 0, 1)}
                  unit={`${f.units.distance}/day`}
                />
                <Metric
                  label="Battery lost"
                  value={f.number(drain.levelPerDay, 1)}
                  unit="%/day"
                  assessment={assessIdleLoss(drain.levelPerDay, f)}
                />
                <Metric
                  label="Average power"
                  value={drain.watts === null ? "—" : Math.round(drain.watts)}
                  unit="W"
                  assessment={assessIdlePower(drain.watts, f)}
                />
                <Metric
                  label="Asleep"
                  value={Math.round(drain.standby * 100)}
                  unit="%"
                  assessment={assessAsleep(drain.standby)}
                  detail={`of ${f.number(drain.hours)} h parked`}
                />
              </dl>
              <table className="mt-8 w-full text-sm tabular">
                <thead>
                  <tr className="text-left text-xs text-subtle">
                    <th className="pb-2 font-normal">Parked</th>
                    <th className="hidden pb-2 text-right font-normal sm:table-cell">
                      Duration
                    </th>
                    <th className="hidden pb-2 text-right font-normal sm:table-cell">
                      Asleep
                    </th>
                    <th className="pb-2 text-right font-normal">Range lost</th>
                    <th className="pb-2 text-right font-normal">Power</th>
                  </tr>
                </thead>
                <tbody>
                  {idle.slice(0, 8).map((row) => (
                    <IdleRow
                      key={row.start.getTime()}
                      period={row}
                      f={f}
                      now={now}
                    />
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </Panel>
      </div>
    </PageTransition>
  );
}
