import { ChevronLeft, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeriesChart } from "@/components/charts/series-chart";
import { MapsOff, RouteMap } from "@/components/maps";
import { Stat } from "@/components/overview/stat";
import { PageTransition } from "@/components/page-transition";
import { Panel } from "@/components/panel";
import { requireCar } from "@/lib/car-route";
import { mapThemeOf } from "@/lib/preferences";
import { findDrive } from "@/lib/queries";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Drive" };

const colors = {
  speed: "var(--chart-1)",
  power: "var(--chart-4)",
  elevation: "var(--chart-3)",
  battery: "var(--chart-2)",
};

function parseDriveId(value: string): number | null {
  return /^\d{1,9}$/.test(value) ? Number(value) : null;
}

export default async function DrivePage({
  params,
}: PageProps<"/cars/[carId]/drives/[driveId]">) {
  const [car, { driveId }, f, preferences] = await Promise.all([
    requireCar(params),
    params,
    getFormatter(),
    getPreferences(),
  ]);
  const id = parseDriveId(driveId);
  const found = id === null ? null : await findDrive(car, id);
  if (!found) notFound();
  const { drive, route, series, energy } = found;
  const now = new Date();
  const rows = series.map((point) => ({
    at: point.at,
    speed: f.speedValue(point.speedKmh),
    power: point.powerKw,
    elevation: f.elevationValue(point.elevationM),
    battery: point.battery,
  }));
  const hasSeries = rows.length > 1;

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/cars/${car.id}/drives`}
            transitionTypes={["tab-back"]}
            className="inline-flex items-center gap-1 rounded py-1 pr-2 text-sm text-muted-foreground transition-tesla hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Drives
          </Link>
          <a
            href={`/api/cars/${car.id}/drives/${drive.id}.gpx`}
            download
            className="inline-flex h-9 items-center gap-2 rounded bg-card px-3 text-sm font-medium transition-tesla hover:bg-accent"
          >
            <Download aria-hidden className="size-4" />
            GPX
          </a>
        </div>
        <h1 className="mt-4 text-[32px] leading-[1.2] font-medium md:text-[40px]">
          {drive.to}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tabular">
          from {drive.from} · {f.day(drive.startAt, now)}{" "}
          {f.clock(drive.startAt)} to {f.clock(drive.endAt)}
          {drive.outsideTempAvg !== null &&
            ` · ${f.temperature(drive.outsideTempAvg)} outside`}
        </p>
      </div>

      <div className="mt-8 h-[22rem] overflow-hidden rounded-xl bg-card md:h-[28rem]">
        {preferences.maps === "show" ? (
          <RouteMap route={route} theme={mapThemeOf(preferences)} />
        ) : (
          <MapsOff />
        )}
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Stat label="Distance">{f.distance(drive.distanceKm)}</Stat>
        <Stat label="Duration">{f.duration(drive.durationMin)}</Stat>
        <Stat label="Consumption">{f.efficiency(drive.efficiencyWhPerKm)}</Stat>
        <Stat
          label="Battery"
          detail={
            drive.startLevel !== null && drive.endLevel !== null
              ? `${drive.startLevel - drive.endLevel} points used`
              : undefined
          }
        >
          {drive.startLevel ?? "—"}% → {drive.endLevel ?? "—"}%
        </Stat>
        <Stat label="Top speed">{f.speed(drive.speedMaxKmh)}</Stat>
        <Stat
          label="Peak power"
          detail={
            drive.powerMinKw !== null && drive.powerMinKw < 0
              ? `Regen up to ${-drive.powerMinKw} kW`
              : undefined
          }
        >
          {drive.powerMaxKw === null ? "—" : `${drive.powerMaxKw} kW`}
        </Stat>
        <Stat
          label="Energy recovered"
          detail={hasSeries ? `${f.energy(energy.usedKwh)} used` : undefined}
        >
          {hasSeries ? f.energy(energy.recoveredKwh) : "—"}
        </Stat>
        <Stat
          label="Climb"
          detail={
            drive.descentM !== null
              ? `${f.elevation(drive.descentM)} descent`
              : undefined
          }
        >
          {f.elevation(drive.ascentM)}
        </Stat>
      </dl>

      {hasSeries && (
        <div className="mt-12 grid grid-cols-1 gap-4">
          <Panel title="Speed and power">
            <SeriesChart
              data={rows}
              xKey="at"
              xFormat="clock"
              chartStyle={f.chartStyle}
              series={[
                {
                  key: "speed",
                  label: "Speed",
                  color: colors.speed,
                  unit: f.units.speed,
                  kind: "area",
                },
                {
                  key: "power",
                  label: "Power",
                  color: colors.power,
                  unit: "kW",
                  axis: "right",
                },
              ]}
              yDomain={[0, "auto"]}
              rightDomain={["auto", "auto"]}
            />
          </Panel>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title={`Elevation (${f.units.elevation})`}>
              <SeriesChart
                data={rows}
                xKey="at"
                xFormat="clock"
                chartStyle={f.chartStyle}
                series={[
                  {
                    key: "elevation",
                    label: "Elevation",
                    color: colors.elevation,
                    unit: f.units.elevation,
                    kind: "area",
                  },
                ]}
                yDomain={["auto", "auto"]}
              />
            </Panel>
            <Panel title="Battery (%)">
              <SeriesChart
                data={rows}
                xKey="at"
                xFormat="clock"
                chartStyle={f.chartStyle}
                series={[
                  {
                    key: "battery",
                    label: "Battery",
                    color: colors.battery,
                    unit: "%",
                  },
                ]}
                yDomain={["auto", "auto"]}
                yFormat="percent"
              />
            </Panel>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
