import { BatteryCharging, Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { DownloadLink } from "@/components/download-link";
import { MapsOff, TripMap, type TripStop } from "@/components/maps";
import { Metric } from "@/components/metric";
import { PageTransition } from "@/components/page-transition";
import { assessConsumption, ratedWhPerKm } from "@/lib/assessment";
import { requireCar } from "@/lib/car-route";
import type { Formatter } from "@/lib/format";
import { mapThemeOf } from "@/lib/preferences";
import { exportCharges, exportDrives, tripRoutes } from "@/lib/queries";
import {
  tripItems,
  tripPresets,
  tripRange,
  tripTotals,
  type TripItem,
} from "@/lib/trip";
import { cn } from "@/lib/utils";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Trip" };

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

const fieldClass =
  "h-10 rounded bg-card px-3 text-sm text-foreground transition-tesla [color-scheme:inherit] hover:bg-accent";

export default async function TripPage({
  params,
  searchParams,
}: PageProps<"/cars/[carId]/drives/trip">) {
  const [car, f, preferences, query] = await Promise.all([
    requireCar(params),
    getFormatter(),
    getPreferences(),
    searchParams,
  ]);
  const now = new Date();
  const base = `/cars/${car.id}`;
  const range = tripRange(
    single(query.from),
    single(query.to),
    f.timeZone,
    now,
  );
  const presets = tripPresets(now, f.timeZone);
  const defaults =
    range === "invalid" ? tripRange(null, null, f.timeZone, now) : range;
  const shown = defaults === "invalid" ? null : defaults;

  const [drives, charges] =
    range === "invalid"
      ? [[], []]
      : await Promise.all([
          exportDrives(car, range),
          exportCharges(car.id, range),
        ]);
  const ascending = [...drives].reverse();
  const routes = await tripRoutes(
    car.id,
    ascending.map((drive) => drive.id),
  );
  const totals = tripTotals(drives, charges);
  const items = tripItems(drives, charges);
  const stops: TripStop[] = charges.flatMap((charge) =>
    charge.latitude !== null && charge.longitude !== null
      ? [
          {
            key: String(charge.id),
            label: charge.place,
            detail: `+${f.energy(charge.energyAddedKwh)}`,
            latitude: charge.latitude,
            longitude: charge.longitude,
          },
        ]
      : [],
  );
  const rangeQuery = shown ? `?from=${shown.from}&to=${shown.to}` : "";

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <BackLink href={`${base}/drives`} label="Drives" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[40px] leading-[1.2] font-medium">Trip</h1>
            {shown && (
              <p className="mt-2 text-sm text-muted-foreground tabular">
                {f.date(shown.start)} to{" "}
                {f.date(new Date(shown.end.getTime() - 1))}
              </p>
            )}
          </div>
          {range !== "invalid" && items.length > 0 && (
            <div className="flex gap-2">
              <DownloadLink
                href={`/api/cars/${car.id}/drives.csv${rangeQuery}`}
                label="Drives CSV"
              />
              <DownloadLink
                href={`/api/cars/${car.id}/charges.csv${rangeQuery}`}
                label="Charges CSV"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <nav aria-label="Ranges" className="flex flex-wrap gap-1">
          {presets.map((preset) => {
            const active =
              shown?.from === preset.from && shown?.to === preset.to;
            return (
              <Link
                key={preset.label}
                href={`${base}/drives/trip?from=${preset.from}&to=${preset.to}`}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium transition-tesla",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {preset.label}
              </Link>
            );
          })}
        </nav>
        <form
          action={`${base}/drives/trip`}
          className="flex flex-wrap items-center gap-2"
        >
          <label className="sr-only" htmlFor="trip-from">
            From
          </label>
          <input
            id="trip-from"
            type="date"
            name="from"
            defaultValue={shown?.from}
            className={fieldClass}
          />
          <span className="text-sm text-subtle">to</span>
          <label className="sr-only" htmlFor="trip-to">
            To
          </label>
          <input
            id="trip-to"
            type="date"
            name="to"
            defaultValue={shown?.to}
            className={fieldClass}
          />
          <button
            type="submit"
            className="h-10 rounded bg-primary px-4 text-sm font-medium text-primary-foreground transition-tesla hover:bg-primary/90"
          >
            Show
          </button>
        </form>
      </div>

      {range === "invalid" ? (
        <p className="mt-10 text-sm text-subtle">
          Choose a range of up to 366 days, with the start on or before the end.
        </p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-sm text-subtle">
          No drive and no charge in this range.
        </p>
      ) : (
        <>
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            <Metric
              size="lg"
              label="Distance"
              value={f.number(f.distanceValue(totals.distanceKm) ?? 0, 0)}
              unit={f.units.distance}
            />
            <Metric
              size="lg"
              label="Driving"
              value={f.duration(totals.drivingMin)}
            />
            <Metric
              size="lg"
              label="Charging"
              value={f.duration(totals.chargingMin)}
            />
            <Metric
              size="lg"
              label="Consumption"
              value={
                totals.consumptionWhPerKm === null
                  ? "—"
                  : f.efficiencyNumber(totals.consumptionWhPerKm)
              }
              unit={f.units.efficiency}
              assessment={assessConsumption(
                totals.consumptionWhPerKm,
                ratedWhPerKm(car),
                f,
                totals.distanceKm,
              )}
            />
            <Metric
              label="Energy used"
              value={f.number(totals.energyUsedKwh, 1)}
              unit="kWh"
            />
            <Metric
              label="Energy added"
              value={f.number(totals.energyAddedKwh, 1)}
              unit="kWh"
            />
            <Metric label="Charging cost" value={f.cost(totals.cost)} />
            <Metric
              label="Records"
              value={`${totals.drives} drives`}
              detail={`${totals.charges} ${totals.charges === 1 ? "charge" : "charges"}`}
            />
          </dl>

          <div className="mt-10 h-[22rem] overflow-hidden rounded-xl bg-card md:h-[28rem]">
            {preferences.maps === "show" ? (
              <TripMap
                routes={ascending.flatMap((drive) => {
                  const route = routes.get(drive.id);
                  return route ? [route] : [];
                })}
                stops={stops}
                theme={mapThemeOf(preferences)}
              />
            ) : (
              <MapsOff />
            )}
          </div>

          <div className="mt-10 space-y-8">
            {f
              .groupByDay(items, (item) => item.at, now)
              .map((group) => (
                <section key={group.label}>
                  <h2 className="mb-2 text-sm text-muted-foreground">
                    {group.label}
                  </h2>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={`${item.kind}-${tripItemId(item)}`}>
                        <TripRow item={item} base={base} f={f} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        </>
      )}
    </PageTransition>
  );
}

function tripItemId(item: TripItem): number {
  return item.kind === "drive" ? item.drive.id : item.charge.id;
}

function TripRow({
  item,
  base,
  f,
}: {
  item: TripItem;
  base: string;
  f: Formatter;
}) {
  const isDrive = item.kind === "drive";
  const Icon = isDrive ? Route : BatteryCharging;
  const href = isDrive
    ? `${base}/drives/${item.drive.id}`
    : `${base}/charging/${item.charge.id}`;
  const title = isDrive
    ? `${item.drive.from} → ${item.drive.to}`
    : item.charge.place;
  const detail = isDrive
    ? `${f.distance(item.drive.distanceKm)} · ${f.duration(item.drive.durationMin)} · ${f.efficiency(item.drive.efficiencyWhPerKm)}`
    : `+${f.energy(item.charge.energyAddedKwh)} · ${f.duration(item.charge.durationMin)}${item.charge.cost === null ? "" : ` · ${f.cost(item.charge.cost)}`}`;
  return (
    <Link
      href={href}
      transitionTypes={["tab-forward"]}
      className="grid grid-cols-[4rem_auto_1fr] items-center gap-4 rounded-xl px-4 py-3 transition-tesla hover:bg-card"
    >
      <span className="text-sm font-medium tabular">{f.clock(item.at)}</span>
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full",
          isDrive
            ? "bg-primary text-primary-foreground"
            : "bg-charge text-primary-foreground",
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-sm text-muted-foreground tabular">
          {detail}
        </span>
      </span>
    </Link>
  );
}
