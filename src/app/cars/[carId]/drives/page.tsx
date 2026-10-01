import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/page-transition";
import { SectionHeader } from "@/components/section-header";
import { requireCar } from "@/lib/car-route";
import { recentDrives } from "@/lib/queries";
import { getFormatter } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Drives" };

export default async function DrivesPage({
  params,
}: PageProps<"/cars/[carId]/drives">) {
  const [car, f] = await Promise.all([requireCar(params), getFormatter()]);
  const drives = await recentDrives(car);
  const now = new Date();
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
            ? `${drives.length} recent drives · ${f.distance(totalKm)}`
            : undefined
        }
      />
      {drives.length === 0 ? (
        <EmptyState title="No record yet." />
      ) : (
        <div className="space-y-8">
          {f
            .groupByDay(drives, (drive) => drive.startAt, now)
            .map((group) => (
              <section key={group.label}>
                <h2 className="mb-2 text-sm text-muted-foreground">
                  {group.label}
                </h2>
                <ul className="space-y-1">
                  {group.items.map((drive) => (
                    <li key={drive.id}>
                      <Link
                        href={`/cars/${car.id}/drives/${drive.id}`}
                        transitionTypes={["tab-forward"]}
                        className="grid grid-cols-[5rem_1fr_auto] items-center gap-4 rounded-xl px-4 py-3 transition-tesla hover:bg-card"
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
                          <p className="text-xs text-subtle">
                            {f.efficiency(drive.efficiencyWhPerKm)}
                          </p>
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
