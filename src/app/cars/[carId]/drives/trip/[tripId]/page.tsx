import { BatteryCharging, CirclePause, Route } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { MapsOff, TripMap, type TripMarker } from "@/components/maps";
import { Stat } from "@/components/overview/stat";
import { PageTransition } from "@/components/page-transition";
import { TripRow } from "@/components/trip-row";
import { assessConsumption, ratedWhPerKm } from "@/lib/assessment";
import { requireCar } from "@/lib/car-route";
import { carPath } from "@/lib/car-slug";
import type { Formatter } from "@/lib/format";
import { mapThemeOf } from "@/lib/preferences";
import { tripRoutes } from "@/lib/queries";
import type { LngLat } from "@/lib/route";
import {
  stopsText,
  tripDestination,
  tripOrigin,
  tripSteps,
  tripSummary,
  type Trip,
  type TripStep,
  type TripStop,
} from "@/lib/trip";
import { findTrip } from "@/lib/trip-data";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Trip" };

function parseTripId(value: string): number | null {
  return /^\d{1,9}$/.test(value) ? Number(value) : null;
}

function stopDetail(stop: TripStop, f: Formatter): string {
  if (!stop.charged) return `Stop · ${f.duration(stop.durationMin)}`;
  const [first] = stop.charges;
  const last = stop.charges.at(-1);
  const added = stop.charges.reduce(
    (sum, charge) => sum + (charge.energyAddedKwh ?? 0),
    0,
  );
  const cost = stop.charges.reduce<number | null>(
    (sum, charge) => (charge.cost === null ? sum : (sum ?? 0) + charge.cost),
    null,
  );
  return [
    `Charging stop · ${f.duration(stop.durationMin)}`,
    first ? `+${f.energy(added)}` : null,
    first && last && first.startLevel !== null && last.endLevel !== null
      ? `${first.startLevel}% → ${last.endLevel}%`
      : null,
    cost === null ? null : f.cost(cost),
  ]
    .filter((text) => text !== null)
    .join(" · ");
}

function markerAt(
  point: LngLat | undefined,
  marker: Omit<TripMarker, "longitude" | "latitude">,
): TripMarker[] {
  return point ? [{ ...marker, longitude: point[0], latitude: point[1] }] : [];
}

function tripMarkers(
  trip: Trip,
  routes: Map<number, LngLat[]>,
  f: Formatter,
): TripMarker[] {
  const firstDrive = trip.drives[0];
  const lastDrive = trip.drives[trip.drives.length - 1];
  const stops = trip.stops.flatMap((stop, index) => {
    const [charge] = stop.charges;
    const charged: LngLat | undefined =
      charge && charge.longitude !== null && charge.latitude !== null
        ? [charge.longitude, charge.latitude]
        : undefined;
    const arrived = trip.legs[index].drives.at(-1);
    return markerAt(charged ?? (arrived && routes.get(arrived.id)?.at(-1)), {
      key: `stop-${index}`,
      kind: stop.charged ? "charge" : "stop",
      label: stop.place,
      detail: stopDetail(stop, f),
    });
  });
  return [
    ...markerAt(routes.get(firstDrive.id)?.[0], {
      key: "start",
      kind: "start",
      label: trip.from,
      detail: f.clock(trip.startAt),
    }),
    ...stops,
    ...markerAt(routes.get(lastDrive.id)?.at(-1), {
      key: "end",
      kind: "end",
      label: trip.to,
      detail: f.clock(trip.endAt),
    }),
  ];
}

function StepRow({
  step,
  base,
  f,
}: {
  step: TripStep;
  base: string;
  f: Formatter;
}) {
  if (step.kind === "leg") {
    const { leg } = step;
    return (
      <TripRow
        href={`${base}/drives/${leg.driveId}`}
        clock={f.clock(step.at)}
        icon={Route}
        tone="drive"
        title={`${leg.from} → ${leg.to}`}
        detail={`${f.distance(leg.distanceKm)} · ${f.duration(leg.durationMin)} · ${f.efficiency(leg.consumptionWhPerKm)}`}
      />
    );
  }
  const { stop } = step;
  const [charge] = stop.charges;
  return (
    <TripRow
      href={charge ? `${base}/charging/${charge.id}` : undefined}
      clock={f.clock(step.at)}
      icon={stop.charged ? BatteryCharging : CirclePause}
      tone={stop.charged ? "charge" : "stop"}
      title={stop.place}
      detail={stopDetail(stop, f)}
    />
  );
}

export default async function TripPage({
  params,
}: PageProps<"/cars/[carId]/drives/trip/[tripId]">) {
  const [car, { tripId }, f, preferences] = await Promise.all([
    requireCar(params),
    params,
    getFormatter(),
    getPreferences(),
  ]);
  const id = parseTripId(tripId);
  const trip = id === null ? null : await findTrip(car, id);
  if (!trip) notFound();
  const routes = await tripRoutes(
    car.id,
    trip.drives.map((drive) => drive.id),
  );
  const now = new Date();
  const base = carPath(car);
  const summary = tripSummary(trip);
  const destination = tripDestination(trip);

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <BackLink href={`${base}/drives`} label="Drives" />
        <h1 className="mt-4 text-[32px] leading-[1.2] font-medium md:text-[40px]">
          {destination.place}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tabular">
          {tripOrigin(trip)} · {f.day(trip.startAt, now)}{" "}
          {f.clock(trip.startAt)} to {f.clock(trip.endAt)}
        </p>
      </div>

      <div className="mt-8 h-[22rem] overflow-hidden rounded-xl bg-card md:h-[28rem]">
        {preferences.maps === "show" ? (
          <TripMap
            routes={trip.drives.flatMap((drive) => {
              const route = routes.get(drive.id);
              return route ? [route] : [];
            })}
            markers={tripMarkers(trip, routes, f)}
            theme={mapThemeOf(preferences)}
          />
        ) : (
          <MapsOff />
        )}
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Stat
          label="Distance"
          detail={`${summary.legs} ${summary.legs === 1 ? "drive" : "drives"}`}
        >
          {f.distance(summary.distanceKm)}
        </Stat>
        <Stat
          label="Duration"
          detail={`${f.duration(summary.drivingMin)} driving`}
        >
          {f.duration(summary.totalMin)}
        </Stat>
        <Stat label="Stopped" detail={stopsText(summary) ?? undefined}>
          {f.duration(summary.stoppedMin)}
        </Stat>
        <Stat
          label="Consumption"
          assessment={assessConsumption(
            summary.consumptionWhPerKm,
            ratedWhPerKm(car),
            f,
            summary.distanceKm,
          )}
        >
          {f.efficiency(summary.consumptionWhPerKm)}
        </Stat>
        <Stat label="Battery">
          {summary.startLevel ?? "—"}% → {summary.endLevel ?? "—"}%
        </Stat>
        <Stat
          label="Energy used"
          detail={
            summary.charges > 0
              ? `+${f.energy(summary.energyAddedKwh)} added`
              : undefined
          }
        >
          {f.energy(summary.energyUsedKwh)}
        </Stat>
        <Stat label="Charging cost">{f.cost(summary.cost)}</Stat>
        <Stat
          label="Average speed"
          detail={
            summary.speedMaxKmh === null
              ? undefined
              : `Top ${f.speed(summary.speedMaxKmh)}`
          }
        >
          {f.speed(summary.movingSpeedKmh)}
        </Stat>
      </dl>

      <ul className="mt-10 space-y-1">
        {tripSteps(trip).map((step) => (
          <li key={`${step.kind}-${step.at.getTime()}`}>
            <StepRow step={step} base={base} f={f} />
          </li>
        ))}
      </ul>
    </PageTransition>
  );
}
