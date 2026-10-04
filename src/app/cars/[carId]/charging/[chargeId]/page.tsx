import { ChevronLeft, ChevronRight, CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { niceDomain } from "@/components/charts/nice-domain";
import { SeriesChart } from "@/components/charts/series-chart";
import { LocationMap } from "@/components/maps";
import { Metric } from "@/components/metric";
import { PageTransition } from "@/components/page-transition";
import { Panel, PanelNote } from "@/components/panel";
import { requireCar } from "@/lib/car-route";
import { costBreakdown } from "@/lib/charge-cost";
import { chargeCurve, findChargeSession } from "@/lib/charge-data";
import { mapThemeOf } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { ongoingText } from "@/lib/vehicle";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Charge" };

const colors = {
  battery: "var(--chart-1)",
  power: "var(--charge)",
  voltage: "var(--chart-4)",
  current: "var(--chart-3)",
};

function parseId(value: string): number | null {
  return /^\d{1,9}$/.test(value) ? Number(value) : null;
}

function LevelGain({ from, to }: { from: number; to: number }) {
  return (
    <div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-subtle/50"
          style={{ width: `${from}%` }}
        />
        <div
          className="absolute inset-y-0 rounded-full bg-charge transition-[width] duration-700 ease-tesla starting:w-0!"
          style={{ left: `${from}%`, width: `${Math.max(0, to - from)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-subtle tabular">
        <span>0%</span>
        <span>
          {from}% → {to}%
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}

function StepLink({
  href,
  label,
  direction,
}: {
  href: string | null;
  label: string;
  direction: "back" | "forward";
}) {
  const Icon = direction === "back" ? ChevronLeft : ChevronRight;
  const className =
    "inline-flex h-9 items-center gap-1 rounded px-3 text-sm font-medium transition-tesla";
  if (!href) {
    return (
      <span className={cn(className, "text-subtle/60")} aria-disabled>
        {direction === "back" && <Icon className="size-4" />}
        {label}
        {direction === "forward" && <Icon className="size-4" />}
      </span>
    );
  }
  return (
    <Link
      href={href}
      transitionTypes={[direction === "back" ? "tab-back" : "tab-forward"]}
      className={cn(className, "bg-card hover:bg-accent")}
    >
      {direction === "back" && <Icon className="size-4" />}
      {label}
      {direction === "forward" && <Icon className="size-4" />}
    </Link>
  );
}

export default async function ChargePage({
  params,
}: PageProps<"/cars/[carId]/charging/[chargeId]">) {
  const [car, { chargeId }, f, preferences] = await Promise.all([
    requireCar(params),
    params,
    getFormatter(),
    getPreferences(),
  ]);
  const id = parseId(chargeId);
  const session = id === null ? null : await findChargeSession(car.id, id);
  if (!session) notFound();
  const curve = await chargeCurve(session.id);
  const now = new Date();
  const base = `/cars/${car.id}/charging`;

  const byLevel = new Map<number, { sum: number; count: number }>();
  for (const point of curve) {
    if (point.level === null || point.power === null) continue;
    const entry = byLevel.get(point.level) ?? { sum: 0, count: 0 };
    entry.sum += point.power;
    entry.count += 1;
    byLevel.set(point.level, entry);
  }
  const powerByLevel = [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, entry]) => ({
      level,
      power: Math.round((entry.sum / entry.count) * 10) / 10,
    }));
  const timeSeries = curve.map((point) => ({
    at: point.at,
    battery: point.level,
    power: point.power,
    voltage: point.voltage,
    current: point.current,
  }));

  const voltages = curve
    .map((point) => point.voltage)
    .filter((value): value is number => value !== null);
  const voltageDomain = niceDomain(voltages);
  const ongoing = session.endAt === null;
  const missing = ongoing ? ongoingText : "—";
  const added = session.energyAddedKwh;
  const averagePower =
    added !== null && session.durationMin
      ? added / (session.durationMin / 60)
      : null;
  const efficiency =
    added !== null && session.energyUsedKwh
      ? (added / session.energyUsedKwh) * 100
      : null;
  const rangeAdded =
    session.startRangeKm !== null && session.endRangeKm !== null
      ? f.distanceValue(session.endRangeKm - session.startRangeKm)
      : null;
  const kind = session.fast
    ? [session.brand, "DC fast charge"].filter(Boolean).join(" ")
    : `AC${session.phases ? `, ${session.phases} phase` : ""}`;
  const levelsAdded =
    session.startLevel !== null && session.endLevel !== null
      ? session.endLevel - session.startLevel
      : null;
  const breakdown = costBreakdown({
    cost: session.cost,
    addedKwh: added,
    billedKwh: session.billedKwh,
    rangeAdded,
    levelsAdded,
  });
  const costSource = session.costEstimated
    ? "Estimate from your price"
    : "Recorded in TeslaMate";
  const settingsLink = (
    <Link
      href={`/cars/${car.id}/settings#cost`}
      className="underline underline-offset-2 transition-tesla hover:text-foreground"
    >
      Settings
    </Link>
  );

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <div className="flex items-center justify-between gap-4">
          <BackLink href={base} label="Charging" />
          <div className="flex gap-2">
            <StepLink
              href={session.previousId ? `${base}/${session.previousId}` : null}
              label="Older"
              direction="back"
            />
            <StepLink
              href={session.nextId ? `${base}/${session.nextId}` : null}
              label="Newer"
              direction="forward"
            />
          </div>
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px] font-medium",
              session.fast
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {session.fast ? "DC" : "AC"}
          </span>
          {kind}
        </p>
        <h1 className="mt-2 text-[32px] leading-[1.2] font-medium md:text-[40px]">
          {session.place}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tabular">
          {f.day(session.startAt, now)} {f.clock(session.startAt)}
          {session.endAt ? ` to ${f.clock(session.endAt)}` : " · charging now"}
        </p>
        {session.unclosed && (
          <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <CircleAlert
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-warning"
            />
            TeslaMate did not close this charge. This happens when TeslaMate
            restarts during a charge. The values come from the charge records.
          </p>
        )}
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Metric
          size="lg"
          label="Energy added"
          value={added === null ? missing : `+${f.number(added, 1)}`}
          unit="kWh"
        />
        <Metric
          size="lg"
          label="Range added"
          value={
            rangeAdded === null
              ? missing
              : `+${f.number(Math.round(rangeAdded))}`
          }
          unit={f.units.distance}
        />
        <Metric
          size="lg"
          label="Peak power"
          value={
            session.maxPowerKw === null ? "—" : Math.round(session.maxPowerKw)
          }
          unit="kW"
        />
        <Metric
          size="lg"
          label="Duration"
          value={
            session.durationMin === null
              ? missing
              : f.duration(session.durationMin)
          }
        />
      </dl>

      {session.startLevel !== null && session.endLevel !== null && (
        <div className="mt-10">
          <LevelGain from={session.startLevel} to={session.endLevel} />
        </div>
      )}

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Metric
          label="Average power"
          value={averagePower === null ? missing : f.number(averagePower, 1)}
          unit="kW"
        />
        <Metric
          label="Charging efficiency"
          value={efficiency === null ? missing : Math.round(efficiency)}
          unit="%"
          detail={
            session.energyUsedKwh
              ? `${f.number(session.energyUsedKwh, 1)} kWh from the charger`
              : undefined
          }
        />
        <Metric
          label="Cost"
          value={session.cost === null ? missing : f.cost(session.cost)}
          detail={
            session.cost !== null ? (
              costSource
            ) : ongoing ? undefined : (
              <>Set a price in {settingsLink}</>
            )
          }
        />
        <Metric
          label="Voltage"
          value={
            session.avgVoltage === null ? "—" : Math.round(session.avgVoltage)
          }
          unit="V"
          detail={
            session.maxCurrent === null
              ? undefined
              : `up to ${Math.round(session.maxCurrent)} A`
          }
        />
      </dl>

      <div className="mt-12 grid grid-cols-1 gap-4">
        {breakdown && (
          <Panel
            title="Cost"
            action={<span className="text-xs text-subtle">{costSource}</span>}
          >
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-3">
              <Metric
                label="Energy billed"
                value={
                  session.billedKwh === null
                    ? "—"
                    : f.number(session.billedKwh, 1)
                }
                unit="kWh"
                detail="From the charger"
              />
              <Metric
                label="Price per kWh"
                value={f.cost(breakdown.perKwhBilled)}
                detail={
                  session.costEstimated ? "Your price" : "Cost ÷ energy billed"
                }
              />
              <Metric
                label="Per kWh in the battery"
                value={f.cost(breakdown.perKwhAdded)}
                detail={
                  added === null
                    ? undefined
                    : `${f.number(added, 1)} kWh stored`
                }
              />
              <Metric
                label="Charging losses"
                value={f.cost(breakdown.lossCost)}
                detail={
                  breakdown.lossKwh === null
                    ? undefined
                    : `${f.number(breakdown.lossKwh, 1)} kWh not stored`
                }
              />
              <Metric
                label={`Per 100 ${f.units.distance} of range`}
                value={f.cost(breakdown.per100Range)}
                detail={
                  rangeAdded === null
                    ? undefined
                    : `${f.number(Math.round(rangeAdded))} ${f.units.distance} added`
                }
              />
              <Metric
                label="Per 1% of battery"
                value={f.cost(breakdown.perLevel)}
                detail={
                  levelsAdded === null ? undefined : `${levelsAdded}% added`
                }
              />
            </dl>
            {session.costEstimated && (
              <p className="mt-6 text-xs text-subtle">
                Change the price in {settingsLink}.
              </p>
            )}
          </Panel>
        )}
        <Panel title="Power by battery level">
          {powerByLevel.length > 1 ? (
            <SeriesChart
              data={powerByLevel}
              xKey="level"
              xFormat="percent"
              xLabel="Battery"
              chartStyle={f.chartStyle}
              series={[
                {
                  key: "power",
                  label: "Power",
                  color: colors.power,
                  unit: "kW",
                  digits: 1,
                  kind: "area",
                },
              ]}
              yDomain={[0, "auto"]}
              height={280}
            />
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Battery and power">
            {timeSeries.length > 1 ? (
              <SeriesChart
                data={timeSeries}
                xKey="at"
                xFormat="clock"
                chartStyle={f.chartStyle}
                series={[
                  {
                    key: "battery",
                    label: "Battery",
                    color: colors.battery,
                    unit: "%",
                    kind: "area",
                  },
                  {
                    key: "power",
                    label: "Power",
                    color: colors.power,
                    unit: "kW",
                    digits: 1,
                    axis: "right",
                  },
                ]}
                yDomain={[0, 100]}
                rightDomain={[0, "auto"]}
                yFormat="percent"
              />
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
          <Panel title="Voltage and current">
            {timeSeries.length > 1 ? (
              <SeriesChart
                data={timeSeries}
                xKey="at"
                xFormat="clock"
                chartStyle={f.chartStyle}
                series={[
                  {
                    key: "voltage",
                    label: "Voltage",
                    color: colors.voltage,
                    unit: "V",
                  },
                  {
                    key: "current",
                    label: "Current",
                    color: colors.current,
                    unit: "A",
                    digits: 1,
                    axis: "right",
                  },
                ]}
                yDomain={voltageDomain}
                rightDomain={[0, "auto"]}
              />
            ) : (
              <PanelNote>No record yet.</PanelNote>
            )}
          </Panel>
        </div>

        {session.latitude !== null &&
          session.longitude !== null &&
          preferences.maps === "show" && (
            <section className="overflow-hidden rounded-xl bg-card">
              <h2 className="px-5 pt-5 text-sm text-muted-foreground md:px-6 md:pt-6">
                Location
              </h2>
              <div className="mt-4 h-72">
                <LocationMap
                  latitude={session.latitude}
                  longitude={session.longitude}
                  theme={mapThemeOf(preferences)}
                />
              </div>
            </section>
          )}
      </div>
    </PageTransition>
  );
}
