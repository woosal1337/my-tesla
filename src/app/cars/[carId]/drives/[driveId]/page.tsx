import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapsOff, RouteMap } from "@/components/maps";
import { Stat } from "@/components/overview/stat";
import { PageTransition } from "@/components/page-transition";
import { requireCar } from "@/lib/car-route";
import { mapThemeOf } from "@/lib/preferences";
import { findDrive } from "@/lib/queries";
import { getFormatter, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Drive" };

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
  const { drive, route } = found;
  const now = new Date();

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <Link
          href={`/cars/${car.id}/drives`}
          transitionTypes={["tab-back"]}
          className="inline-flex items-center gap-1 rounded py-1 pr-2 text-sm text-muted-foreground transition-tesla hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Drives
        </Link>
        <h1 className="mt-4 text-[32px] leading-[1.2] font-medium md:text-[40px]">
          {drive.to}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tabular">
          from {drive.from} · {f.day(drive.startAt, now)}{" "}
          {f.clock(drive.startAt)} to {f.clock(drive.endAt)}
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
        <Stat label="Peak power">
          {drive.powerMaxKw === null ? "—" : `${drive.powerMaxKw} kW`}
        </Stat>
        <Stat label="Outside">{f.temperature(drive.outsideTempAvg)}</Stat>
      </dl>
    </PageTransition>
  );
}
