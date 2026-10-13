import type { Metadata } from "next";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { DayHeading, rowLinkClass } from "@/components/day-list";
import { DownloadLink } from "@/components/download-link";
import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/page-transition";
import { SectionHeader } from "@/components/section-header";
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
import { recentDrives } from "@/lib/queries";
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
  const drives = await recentDrives(car);
  const now = new Date();
  const rated = ratedWhPerKm(car);
  const totalKm = drives.reduce(
    (sum, drive) => sum + (drive.distanceKm ?? 0),
    0,
  );

  return (
    <PageTransition>
      <SectionHeader
        title="Drives"
        summary={
          drives.length
            ? [
                `${drives.length} recent ${drives.length === 1 ? "drive" : "drives"}`,
                f.distance(totalKm),
              ]
            : undefined
        }
        action={
          drives.length > 0 && (
            <div className="flex gap-2">
              <Link
                href={carPath(car, "/drives/trip")}
                transitionTypes={["tab-forward"]}
                className="inline-flex h-9 items-center gap-2 rounded bg-card px-3 text-sm font-medium transition-tesla hover:bg-accent"
              >
                <MapIcon aria-hidden className="size-4" />
                Trips
              </Link>
              <DownloadLink
                href={`/api/cars/${car.id}/drives.csv`}
                label="CSV"
              />
            </div>
          )
        }
      />
      {drives.length === 0 ? (
        <EmptyState title="No drives yet">
          A drive shows here after the car drives. TeslaMate records only from
          the moment you sign in.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {f
            .groupByDay(drives, (drive) => drive.startAt, now)
            .map((group) => (
              <section key={group.label}>
                <DayHeading>{group.label}</DayHeading>
                <ul className="space-y-1">
                  {group.items.map((drive) => (
                    <li key={drive.id}>
                      <Link
                        href={carPath(car, `/drives/${drive.id}`)}
                        transitionTypes={["tab-forward"]}
                        className={cn(
                          "grid grid-cols-[4.5rem_1fr_auto] sm:grid-cols-[5rem_1fr_auto]",
                          rowLinkClass,
                        )}
                      >
                        <div className="tabular">
                          <p className="font-medium">
                            {f.clock(drive.startAt)}
                          </p>
                          <p className="text-xs text-subtle">
                            {f.duration(drive.durationMin)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{drive.to}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            from {drive.from}
                          </p>
                        </div>
                        <div className="text-right tabular">
                          <p className="font-medium">
                            {f.distance(drive.distanceKm)}
                          </p>
                          <DriveConsumption
                            assessment={assessConsumption(
                              drive.efficiencyWhPerKm,
                              rated,
                              f,
                              drive.distanceKm,
                            )}
                          >
                            {f.efficiency(drive.efficiencyWhPerKm)}
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
