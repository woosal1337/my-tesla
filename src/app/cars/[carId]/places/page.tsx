import type { Metadata } from "next";
import { MapsOff, PlacesMap, type MapPlace } from "@/components/maps";
import { Metric } from "@/components/metric";
import { PageTransition } from "@/components/page-transition";
import { Panel, PanelNote } from "@/components/panel";
import { PeriodLinks } from "@/components/period-links";
import { requireCar } from "@/lib/car-route";
import { periodStart, periods, readPeriod } from "@/lib/insights";
import { mapThemeOf } from "@/lib/preferences";
import { chargingPlaces, geofenceList, visitedPlaces } from "@/lib/places-data";
import { toElevation } from "@/lib/units";
import { cn } from "@/lib/utils";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Places" };

export default async function PlacesPage({
  params,
  searchParams,
}: PageProps<"/cars/[carId]/places">) {
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
  const [visited, charging, geofences] = await Promise.all([
    visitedPlaces(car.id, from),
    chargingPlaces(car.id, from),
    geofenceList(),
  ]);

  const top = visited.slice(0, 10);
  const mostVisits = Math.max(1, ...top.map((place) => place.visits));
  const longest = [...visited].sort((a, b) => b.parkedS - a.parkedS)[0];
  const parkedTotal = visited.reduce((sum, place) => sum + place.parkedS, 0);
  const chargingKeys = new Set(charging.map((place) => place.key));
  const visitKeys = new Set(visited.map((place) => place.key));
  const chargedTotal = charging.reduce((sum, place) => sum + place.addedKwh, 0);
  const visitsByFence = new Map(
    visited
      .filter((place) => place.geofenceId !== null)
      .map((place) => [place.geofenceId, place]),
  );
  const chargesByFence = new Map(
    charging
      .filter((place) => place.geofenceId !== null)
      .map((place) => [place.geofenceId, place]),
  );

  const mapPlaces: MapPlace[] = [
    ...visited.slice(0, 40).flatMap((place): MapPlace[] =>
      place.latitude === null || place.longitude === null
        ? []
        : [
            {
              key: place.key,
              label: place.label,
              detail: `${place.visits} ${place.visits === 1 ? "visit" : "visits"}`,
              latitude: place.latitude,
              longitude: place.longitude,
              weight: place.visits,
              kind: chargingKeys.has(place.key) ? "both" : "visit",
            },
          ],
    ),
    ...charging
      .filter((place) => !visitKeys.has(place.key))
      .flatMap((place): MapPlace[] =>
        place.latitude === null || place.longitude === null
          ? []
          : [
              {
                key: place.key,
                label: place.label,
                detail: `${place.sessions} ${place.sessions === 1 ? "charge" : "charges"}`,
                latitude: place.latitude,
                longitude: place.longitude,
                weight: place.sessions,
                kind: "charge",
              },
            ],
      ),
  ];
  const periodLabel =
    periods.find((candidate) => candidate.id === period)?.label ?? "";

  return (
    <PageTransition>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-6 md:pt-10">
        <div>
          <p className="text-sm text-muted-foreground">
            {period === "all" ? "All records" : `Last ${periodLabel}`}
          </p>
          <h1 className="mt-1 text-[32px] leading-[1.2] font-medium md:text-[40px]">
            Places
          </h1>
        </div>
        <PeriodLinks base={`/cars/${car.id}/places`} active={period} />
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Metric
          size="lg"
          label="Places"
          value={visited.length}
          detail={`${visited.reduce((sum, place) => sum + place.visits, 0)} arrivals`}
        />
        <Metric
          size="lg"
          label="Most time"
          value={
            longest && parkedTotal
              ? Math.round((longest.parkedS / parkedTotal) * 100)
              : "—"
          }
          unit={longest ? "%" : undefined}
          detail={longest ? `at ${longest.label}` : undefined}
        />
        <Metric
          size="lg"
          label="Charging places"
          value={charging.length}
          detail={`${f.number(chargedTotal)} kWh added`}
        />
        <Metric
          size="lg"
          label="Saved places"
          value={geofences.length}
          detail="Geofences in TeslaMate"
        />
      </dl>

      <section className="mt-12 overflow-hidden rounded-xl bg-card">
        <header className="flex flex-wrap items-center justify-between gap-4 px-5 pt-5 md:px-6 md:pt-6">
          <h2 className="text-sm text-muted-foreground">Map</h2>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              Visited
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-charge" />
              Charged
            </span>
          </div>
        </header>
        <div className="mt-4 h-[420px]">
          {preferences.maps === "hide" ? (
            <MapsOff />
          ) : mapPlaces.length ? (
            <PlacesMap places={mapPlaces} theme={mapThemeOf(preferences)} />
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel title="Most visited" className="lg:col-span-3">
          {top.length ? (
            <ol className="space-y-4">
              {top.map((place, index) => (
                <li key={place.key} className="flex items-start gap-4">
                  <span className="w-4 pt-0.5 text-sm text-subtle tabular">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="truncate text-sm font-medium">
                        {place.label}
                      </span>
                      <span className="shrink-0 text-sm tabular">
                        {place.visits}{" "}
                        <span className="text-muted-foreground">
                          {place.visits === 1 ? "visit" : "visits"}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-700 ease-tesla starting:w-0!",
                          chargingKeys.has(place.key)
                            ? "bg-charge"
                            : "bg-primary",
                        )}
                        style={{
                          width: `${(place.visits / mostVisits) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 truncate text-xs text-subtle tabular">
                      {[
                        place.city && place.city !== place.label
                          ? place.city
                          : null,
                        `${f.span(place.parkedS / 60)} parked`,
                        `last visit ${f.dayInline(place.lastAt, now)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </Panel>

        <Panel title="Charging places" className="lg:col-span-2">
          {charging.length ? (
            <ul className="divide-y divide-border">
              {charging.map((place) => (
                <li key={place.key} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[11px] font-medium",
                        place.fast
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {place.fast ? "DC" : "AC"}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {place.label}
                    </span>
                  </div>
                  <p className="mt-1.5 flex justify-between gap-4 text-xs text-muted-foreground tabular">
                    <span>
                      {place.sessions}{" "}
                      {place.sessions === 1 ? "charge" : "charges"} ·{" "}
                      {f.number(place.addedKwh)} kWh
                    </span>
                    <span>
                      {place.cost === null
                        ? "No cost"
                        : `${f.cost(place.cost)} · ${f.cost(place.cost / place.addedKwh)}/kWh`}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <PanelNote>No record yet.</PanelNote>
          )}
        </Panel>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-medium">Saved places</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          TeslaMate names a place and sets its charging cost with a geofence.
        </p>
        {geofences.length ? (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {geofences.map((fence) => {
              const visits = visitsByFence.get(fence.id);
              const charges = chargesByFence.get(fence.id);
              return (
                <li key={fence.id} className="rounded-xl bg-card p-5">
                  <p className="truncate font-medium">{fence.name}</p>
                  <p className="mt-1 text-xs text-subtle tabular">
                    {f.number(toElevation(fence.radius, preferences))}{" "}
                    {f.units.elevation} radius
                  </p>
                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm tabular">
                    <div>
                      <dt className="text-xs text-muted-foreground">Visits</dt>
                      <dd className="mt-0.5 font-medium">
                        {visits?.visits ?? 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Charged</dt>
                      <dd className="mt-0.5 font-medium">
                        {charges ? `${f.number(charges.addedKwh)} kWh` : "—"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">
                        Cost per kWh
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {fence.costPerUnit === null
                          ? "Not set"
                          : f.cost(fence.costPerUnit)}
                        {fence.sessionFee
                          ? ` + ${f.cost(fence.sessionFee)} per session`
                          : ""}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 rounded-xl bg-card px-6 py-12 text-center text-sm text-subtle">
            No saved places yet.
          </p>
        )}
      </section>
    </PageTransition>
  );
}
