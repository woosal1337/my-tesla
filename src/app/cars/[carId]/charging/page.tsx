import type { Metadata } from "next";
import Link from "next/link";
import { DownloadLink } from "@/components/download-link";
import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/page-transition";
import { SectionHeader } from "@/components/section-header";
import { requireCar } from "@/lib/car-route";
import { recentCharges } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { ongoingText } from "@/lib/vehicle";
import { getFormatter } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Charging" };

function LevelBar({
  start,
  end,
}: {
  start: number | null;
  end: number | null;
}) {
  if (start === null || end === null) return null;
  return (
    <div className="relative mt-2 h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
      <div
        className="absolute inset-y-0 rounded-full bg-charge"
        style={{ left: `${start}%`, width: `${Math.max(0, end - start)}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-subtle/50"
        style={{ width: `${start}%` }}
      />
    </div>
  );
}

export default async function ChargingPage({
  params,
}: PageProps<"/cars/[carId]/charging">) {
  const [car, f] = await Promise.all([requireCar(params), getFormatter()]);
  const charges = await recentCharges(car.id);
  const now = new Date();
  const totalKwh = charges.reduce(
    (sum, charge) => sum + (charge.energyAddedKwh ?? 0),
    0,
  );

  return (
    <PageTransition>
      <SectionHeader
        title="Charging"
        summary={
          charges.length
            ? `${charges.length} recent charges · ${f.energy(totalKwh)} added`
            : undefined
        }
        action={
          charges.length > 0 && (
            <DownloadLink
              href={`/api/cars/${car.id}/charges.csv`}
              label="CSV"
            />
          )
        }
      />
      {charges.length === 0 ? (
        <EmptyState title="No record yet." />
      ) : (
        <div className="space-y-8">
          {f
            .groupByDay(charges, (charge) => charge.startAt, now)
            .map((group) => (
              <section key={group.label}>
                <h2 className="mb-2 text-sm text-muted-foreground">
                  {group.label}
                </h2>
                <ul className="space-y-1">
                  {group.items.map((charge) => (
                    <li key={charge.id}>
                      <Link
                        href={`/cars/${car.id}/charging/${charge.id}`}
                        transitionTypes={["tab-forward"]}
                        className="grid grid-cols-[5rem_1fr_auto] items-center gap-4 rounded-xl px-4 py-3 transition-tesla hover:bg-card"
                      >
                        <div className="tabular">
                          <p className="font-medium">
                            {f.clock(charge.startAt)}
                          </p>
                          <p className="text-xs text-subtle">
                            {charge.endAt
                              ? f.duration(charge.durationMin)
                              : "Now"}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            <span className="truncate">{charge.place}</span>
                            <span
                              className={cn(
                                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                                charge.fastCharger
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {charge.fastCharger ? "DC" : "AC"}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground tabular">
                            {[
                              charge.startLevel !== null &&
                              charge.endLevel !== null
                                ? `${charge.startLevel}% → ${charge.endLevel}%`
                                : charge.endAt
                                  ? "—"
                                  : null,
                              charge.maxPowerKw
                                ? `up to ${Math.round(charge.maxPowerKw)} kW`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <LevelBar
                            start={charge.startLevel}
                            end={charge.endLevel}
                          />
                        </div>
                        <div className="text-right tabular">
                          {charge.energyAddedKwh === null && !charge.endAt ? (
                            <p className="flex items-center justify-end gap-1.5 font-medium text-charge">
                              <span className="size-1.5 animate-pulse rounded-full bg-charge" />
                              {ongoingText}
                            </p>
                          ) : (
                            <p className="font-medium">
                              +{f.energy(charge.energyAddedKwh)}
                            </p>
                          )}
                          <p className="text-xs text-subtle">
                            {charge.cost === null ? "" : f.cost(charge.cost)}
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
