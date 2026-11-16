import type { Metadata } from "next";
import Link from "next/link";
import { ChartColumn } from "lucide-react";
import { ChargerBadge } from "@/components/charger-badge";
import { DayHeading, rowLinkClass } from "@/components/day-list";
import { DotList } from "@/components/dot-list";
import { DownloadLink } from "@/components/download-link";
import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/page-transition";
import { SectionHeader } from "@/components/section-header";
import { requireCar } from "@/lib/car-route";
import { carPath } from "@/lib/car-slug";
import { chargesDayTotal } from "@/lib/day-total";
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
    <div
      aria-hidden
      className="relative mt-2 h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted"
    >
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
  const costs = charges
    .map((charge) => charge.cost)
    .filter((cost): cost is number => cost !== null);
  const totalCost = costs.reduce((sum, cost) => sum + cost, 0);

  return (
    <PageTransition>
      <SectionHeader
        title="Charging"
        summary={
          charges.length
            ? [
                `${charges.length} recent ${charges.length === 1 ? "charge" : "charges"}`,
                `${f.energy(totalKwh)} added`,
                costs.length ? `${f.cost(totalCost)} spent` : null,
              ]
            : undefined
        }
        action={
          charges.length > 0 && (
            <div className="flex gap-2">
              <Link
                href={carPath(car, "/charging/insights")}
                transitionTypes={["tab-forward"]}
                className="inline-flex h-9 items-center gap-2 rounded bg-card px-3 text-sm font-medium transition-tesla hover:bg-accent"
              >
                <ChartColumn aria-hidden className="size-4" />
                Insights
              </Link>
              <DownloadLink
                href={`/api/cars/${car.id}/charges.csv`}
                label="CSV"
              />
            </div>
          )
        }
      />
      {charges.length === 0 ? (
        <EmptyState title="No charges yet">
          A charge shows here after the car charges. TeslaMate records only from
          the moment you sign in.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {f
            .groupByDay(charges, (charge) => charge.startAt, now)
            .map((group) => (
              <section key={group.label}>
                <DayHeading
                  title={group.label}
                  total={chargesDayTotal(group.items, f)}
                />
                <ul className="space-y-1">
                  {group.items.map((charge) => (
                    <li key={charge.id}>
                      <Link
                        href={carPath(car, `/charging/${charge.id}`)}
                        transitionTypes={["tab-forward"]}
                        className={cn(
                          "grid grid-cols-[4.5rem_1fr_auto] sm:grid-cols-[5rem_1fr_auto]",
                          rowLinkClass,
                        )}
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
                            <ChargerBadge fast={charge.fastCharger} />
                          </p>
                          <p className="text-sm text-muted-foreground tabular">
                            <DotList
                              parts={[
                                charge.startLevel !== null &&
                                charge.endLevel !== null
                                  ? `${charge.startLevel}% → ${charge.endLevel}%`
                                  : charge.endAt
                                    ? "—"
                                    : null,
                                charge.maxPowerKw
                                  ? `up to ${Math.round(charge.maxPowerKw)} kW`
                                  : null,
                              ]}
                            />
                          </p>
                          <LevelBar
                            start={charge.startLevel}
                            end={charge.endLevel}
                          />
                        </div>
                        <div className="text-right tabular">
                          {charge.energyAddedKwh === null && !charge.endAt ? (
                            <p className="flex items-center justify-end gap-1.5 font-medium text-charge">
                              <span className="size-1.5 rounded-full bg-charge motion-safe:animate-pulse" />
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
