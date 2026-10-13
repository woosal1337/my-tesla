import { BatteryCharging, Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { DayHeading } from "@/components/day-list";
import { DownloadLink } from "@/components/download-link";
import { MapsOff, TripMap, type TripMarker } from "@/components/maps";
import { Metric } from "@/components/metric";
import { PageTransition } from "@/components/page-transition";
import { TripRow } from "@/components/trip-row";
import { assessConsumption, ratedWhPerKm } from "@/lib/assessment";
import { requireCar } from "@/lib/car-route";
import { carPath } from "@/lib/car-slug";
import type { Formatter } from "@/lib/format";
import { mapThemeOf } from "@/lib/preferences";
import { tripRoutes } from "@/lib/queries";
import {
  stopsText,
  tripDestination,
  tripItems,
  tripPath,
  tripPresets,
  tripRange,
  tripSummary,
  tripTotals,
  type TripItem,
} from "@/lib/trip";
import { tripsInRange } from "@/lib/trip-data";
import { cn } from "@/lib/utils";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Report" };

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

const fieldClass =
  "h-10 rounded bg-card px-3 text-sm text-foreground transition-tesla [color-scheme:inherit] hover:bg-accent";

export default async function ReportPage({
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
  const base = carPath(car);
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

  const { trips, drives, charges } =
    range === "invalid"
      ? { trips: [], drives: [], charges: [] }
      : await tripsInRange(car, range);
  const ascending = [...drives].reverse();
  const routes = await tripRoutes(
    car.id,
    ascending.map((drive) => drive.id),
  );
  const totals = tripTotals(drives, charges);
  const items = tripItems(trips, charges);
  const markers: TripMarker[] = charges.flatMap((charge) =>
    charge.latitude !== null && charge.longitude !== null
      ? [
          {
            key: String(charge.id),
            kind: "charge",
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
            <h1 className="text-[40px] leading-[1.2] font-medium">Report</h1>
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
              value={`${trips.length} ${trips.length === 1 ? "trip" : "trips"}`}
              detail={`${totals.drives} drives · ${totals.charges} ${totals.charges === 1 ? "charge" : "charges"}`}
            />
          </dl>

          <div className="mt-10 h-[22rem] overflow-hidden rounded-xl bg-card md:h-[28rem]">
            {preferences.maps === "show" ? (
              <TripMap
                routes={ascending.flatMap((drive) => {
                  const route = routes.get(drive.id);
                  return route ? [route] : [];
                })}
                markers={markers}
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
                  <DayHeading>{group.label}</DayHeading>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={`${item.kind}-${tripItemId(item)}`}>
                        <ItemRow item={item} base={base} f={f} />
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
  return item.kind === "trip" ? item.trip.id : item.charge.id;
}

function ItemRow({
  item,
  base,
  f,
}: {
  item: TripItem;
  base: string;
  f: Formatter;
}) {
  if (item.kind === "charge") {
    const { charge } = item;
    return (
      <TripRow
        href={`${base}/charging/${charge.id}`}
        clock={f.clock(item.at)}
        icon={BatteryCharging}
        tone="charge"
        title={charge.place}
        detail={`+${f.energy(charge.energyAddedKwh)} · ${f.duration(charge.durationMin)}${charge.cost === null ? "" : ` · ${f.cost(charge.cost)}`}`}
      />
    );
  }
  const { trip } = item;
  const summary = tripSummary(trip);
  const destination = tripDestination(trip);
  const details = [
    destination.roundTrip ? "Round trip" : null,
    f.distance(summary.distanceKm),
    f.duration(summary.totalMin),
    stopsText(summary),
  ].filter((text) => text !== null);
  return (
    <TripRow
      href={`${base}${tripPath(trip)}`}
      clock={f.clock(item.at)}
      icon={Route}
      tone="drive"
      title={`${trip.from} → ${destination.place}`}
      detail={details.join(" · ")}
    />
  );
}
