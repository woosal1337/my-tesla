import type { Metadata } from "next";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { DayHeading, rowLinkClass } from "@/components/day-list";
import { DotList } from "@/components/dot-list";
import { DownloadLink } from "@/components/download-link";
import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/page-transition";
import { SectionHeader } from "@/components/section-header";
import { TripStrip } from "@/components/trip-strip";
import type { ReactNode } from "react";
import {
  assessConsumption,
  assessmentTitle,
  ratedWhPerKm,
  toneClass,
  type Assessment,
} from "@/lib/assessment";
import { requireCar } from "@/lib/car-route";
import { carPath } from "@/lib/car-slug";
import {
  stopsText,
  tripDestination,
  tripOrigin,
  tripPath,
  tripSegments,
  tripSummary,
} from "@/lib/trip";
import { recentTrips } from "@/lib/trip-data";
import { cn } from "@/lib/utils";
import { getFormatter } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Drives" };

function DriveConsumption({
  assessment,
  children,
}: {
  assessment: Assessment | null;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-xs text-subtle",
        assessment && toneClass[assessment.tone],
      )}
      title={assessment ? assessmentTitle(assessment) : undefined}
    >
      {children}
    </p>
  );
}

export default async function DrivesPage({
  params,
}: PageProps<"/cars/[carId]/drives">) {
  const [car, f] = await Promise.all([requireCar(params), getFormatter()]);
  const trips = (await recentTrips(car)).map((trip) => ({
    trip,
    summary: tripSummary(trip),
  }));
  const now = new Date();
  const rated = ratedWhPerKm(car);
  const totalKm = trips.reduce(
    (sum, { summary }) => sum + summary.distanceKm,
    0,
  );

  return (
    <PageTransition>
      <SectionHeader
        title="Drives"
        summary={
          trips.length
            ? [
                `${trips.length} recent ${trips.length === 1 ? "trip" : "trips"}`,
                f.distance(totalKm),
              ]
            : undefined
        }
        action={
          trips.length > 0 && (
            <div className="flex gap-2">
              <Link
                href={carPath(car, "/drives/trip")}
                transitionTypes={["tab-forward"]}
                className="inline-flex h-9 items-center gap-2 rounded bg-card px-3 text-sm font-medium transition-tesla hover:bg-accent"
              >
                <MapIcon aria-hidden className="size-4" />
                Report
              </Link>
              <DownloadLink
                href={`/api/cars/${car.id}/drives.csv`}
                label="CSV"
              />
            </div>
          )
        }
      />
      {trips.length === 0 ? (
        <EmptyState title="No drives yet">
          A drive shows here after the car drives. TeslaMate records only from
          the moment you sign in.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {f
            .groupByDay(trips, ({ trip }) => trip.startAt, now)
            .map((group) => (
              <section key={group.label}>
                <DayHeading>{group.label}</DayHeading>
                <ul className="space-y-1">
                  {group.items.map(({ trip, summary }) => (
                    <li key={trip.id}>
                      <Link
                        href={carPath(car, tripPath(trip))}
                        transitionTypes={["tab-forward"]}
                        className={cn(
                          "grid grid-cols-[4.5rem_1fr_auto] sm:grid-cols-[5rem_1fr_auto]",
                          rowLinkClass,
                        )}
                      >
                        <div className="tabular">
                          <p className="font-medium">{f.clock(trip.startAt)}</p>
                          <p className="text-xs text-subtle">
                            {f.duration(summary.totalMin)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {tripDestination(trip).place}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            <DotList
                              parts={[tripOrigin(trip), stopsText(summary)]}
                            />
                          </p>
                          <TripStrip segments={tripSegments(trip)} />
                        </div>
                        <div className="text-right tabular">
                          <p className="font-medium">
                            {f.distance(summary.distanceKm)}
                          </p>
                          <DriveConsumption
                            assessment={assessConsumption(
                              summary.consumptionWhPerKm,
                              rated,
                              f,
                              summary.distanceKm,
                            )}
                          >
                            {f.efficiency(summary.consumptionWhPerKm)}
                          </DriveConsumption>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </PageTransition>
  );
}
