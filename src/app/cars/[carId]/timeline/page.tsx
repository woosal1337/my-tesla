import {
  BatteryCharging,
  ChevronLeft,
  ChevronRight,
  Moon,
  Route,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BackLink } from "@/components/back-link";
import { DayStrip, DayStripLegend } from "@/components/day-strip";
import { Metric } from "@/components/metric";
import { PageTransition } from "@/components/page-transition";
import { requireCar } from "@/lib/car-route";
import type { Formatter } from "@/lib/format";
import {
  buildTimeline,
  dayWindow,
  localDayKey,
  parseDayKey,
  shiftDayKey,
  timelineItems,
  type TimelineItem,
} from "@/lib/insights";
import { dayRecords } from "@/lib/timeline-data";
import { cn } from "@/lib/utils";
import { ongoingText } from "@/lib/vehicle";
import { getFormatter } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Timeline" };

const minuteMs = 60_000;

function ItemRow({
  item,
  carId,
  f,
}: {
  item: TimelineItem;
  carId: number;
  f: Formatter;
}) {
  const durationOf = (ms: number) => f.duration(ms / minuteMs);
  const open = item.kind === "charge" && item.charge.end === null;
  const time = `${f.clock(item.start)} – ${open ? "Now" : f.clock(item.end)}`;
  const length = item.end.getTime() - item.start.getTime();
  let icon: ReactNode;
  let title: string;
  let detail: string;
  let href: string | null = null;
  let dot: string;
  if (item.kind === "drive") {
    icon = <Route className="size-4" />;
    title = `Drive to ${item.drive.to}`;
    detail = `${f.distance(item.drive.distanceKm)} · ${durationOf(length)} · from ${item.drive.from}`;
    href = `/cars/${carId}/drives/${item.drive.id}`;
    dot = "bg-primary text-primary-foreground";
  } else if (item.kind === "charge") {
    icon = <BatteryCharging className="size-4" />;
    title = `${open ? "Charging" : "Charged"} at ${item.charge.place}`;
    detail = `${open ? ongoingText : `+${f.energy(item.charge.energyAddedKwh)}`} · ${durationOf(length)} · ${item.charge.fast ? "DC" : "AC"}`;
    href = `/cars/${carId}/charging/${item.charge.id}`;
    dot = "bg-charge text-primary-foreground";
  } else {
    icon = <Moon className="size-4" />;
    title = item.place ? `Parked at ${item.place}` : "Parked";
    detail = [
      item.asleepMs ? `asleep ${durationOf(item.asleepMs)}` : null,
      item.awakeMs ? `awake ${durationOf(item.awakeMs)}` : null,
      item.offlineMs ? `offline ${durationOf(item.offlineMs)}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    dot = "bg-accent text-muted-foreground";
  }
  const body = (
    <>
      <span
        className={cn(
          "hidden shrink-0 pt-1 text-sm text-muted-foreground tabular sm:block",
          f.settings.clock === "12h" ? "w-40" : "w-28",
        )}
      >
        {time}
      </span>
      <span
        className={cn(
          "relative z-10 grid size-8 shrink-0 place-items-center rounded-full",
          dot,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block text-xs text-subtle tabular sm:hidden">
          {time}
        </span>
        <span className="block truncate font-medium">{title}</span>
        <span className="block text-sm text-pretty text-muted-foreground tabular">
          {detail}
        </span>
      </span>
    </>
  );
  const className =
    "relative flex items-start gap-4 rounded-xl px-3 py-3 transition-tesla";
  return (
    <li>
      {href ? (
        <Link
          href={href}
          transitionTypes={["tab-forward"]}
          className={cn(className, "hover:bg-card")}
        >
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  );
}

function DayLink({
  href,
  direction,
  label,
}: {
  href: string | null;
  direction: "back" | "forward";
  label: string;
}) {
  const Icon = direction === "back" ? ChevronLeft : ChevronRight;
  const className = "grid size-9 place-items-center rounded transition-tesla";
  return href ? (
    <Link
      href={href}
      aria-label={label}
      transitionTypes={[direction === "back" ? "tab-back" : "tab-forward"]}
      className={cn(className, "bg-card hover:bg-accent")}
    >
      <Icon className="size-4" />
    </Link>
  ) : (
    <span className={cn(className, "text-subtle/50")} aria-hidden>
      <Icon className="size-4" />
    </span>
  );
}

export default async function TimelinePage({
  params,
  searchParams,
}: PageProps<"/cars/[carId]/timeline">) {
  const [car, query] = await Promise.all([requireCar(params), searchParams]);
  const now = new Date();
  const f = await getFormatter();
  const timeZone = f.timeZone;
  const today = localDayKey(now, timeZone);
  const requested = parseDayKey(
    typeof query.day === "string" ? query.day : undefined,
  );
  const day = requested && requested <= today ? requested : today;
  const window = dayWindow(day, timeZone);
  const records = await dayRecords(car.id, window.start, window.end);
  const segments = buildTimeline({ ...records, ...window, now });
  const items = timelineItems(segments).filter(
    (item) => item.end.getTime() - item.start.getTime() >= minuteMs,
  );
  const sum = (kind: string) =>
    segments
      .filter((segment) => segment.kind === kind)
      .reduce(
        (total, segment) =>
          total + segment.end.getTime() - segment.start.getTime(),
        0,
      );
  const driven = records.drives.reduce(
    (total, drive) => total + (drive.distanceKm ?? 0),
    0,
  );
  const charged = records.charges.reduce(
    (total, charge) => total + (charge.energyAddedKwh ?? 0),
    0,
  );
  const covered = segments.reduce(
    (total, segment) => total + segment.end.getTime() - segment.start.getTime(),
    0,
  );
  const base = `/cars/${car.id}/timeline`;
  const label = f.day(window.start, now);

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <BackLink href={`/cars/${car.id}`} label="Overview" />
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Timeline</p>
            <h1 className="mt-1 text-[32px] leading-[1.2] font-medium md:text-[40px]">
              {label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {day !== today && (
              <Link
                href={base}
                className="inline-flex h-9 items-center rounded bg-card px-3 text-sm font-medium transition-tesla hover:bg-accent"
              >
                Today
              </Link>
            )}
            <DayLink
              href={`${base}?day=${shiftDayKey(day, -1)}`}
              direction="back"
              label="Day before"
            />
            <DayLink
              href={day < today ? `${base}?day=${shiftDayKey(day, 1)}` : null}
              direction="forward"
              label="Day after"
            />
          </div>
        </div>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Metric
          label="Driven"
          value={f.number(Math.round(f.distanceValue(driven) ?? 0))}
          unit={f.units.distance}
          detail={`${records.drives.length} ${records.drives.length === 1 ? "drive" : "drives"}`}
        />
        <Metric
          label="Driving time"
          value={f.duration(sum("drive") / minuteMs)}
        />
        <Metric
          label="Charged"
          value={f.number(charged, 1)}
          unit="kWh"
          detail={`${records.charges.length} ${records.charges.length === 1 ? "session" : "sessions"}`}
        />
        <Metric
          label="Asleep"
          value={covered ? Math.round((sum("asleep") / covered) * 100) : 0}
          unit="%"
          detail="of the recorded time"
        />
      </dl>

      <section className="mt-10 rounded-xl bg-card p-5 md:p-6">
        <DayStrip
          segments={segments}
          start={window.start}
          end={window.end}
          hourLabels={[0, 6, 12, 18, 24].map((hour) => f.hour(hour))}
          now={now}
        />
        <div className="mt-4">
          <DayStripLegend />
        </div>
      </section>

      {items.length ? (
        <ol
          className={cn(
            "relative mt-8 space-y-1 before:absolute before:top-6 before:bottom-6 before:left-[1.75rem] before:w-px before:bg-border",
            f.settings.clock === "12h"
              ? "sm:before:left-[12.75rem]"
              : "sm:before:left-[9.75rem]",
          )}
        >
          {items.map((item) => (
            <ItemRow
              key={`${item.kind}-${item.start.getTime()}`}
              item={item}
              carId={car.id}
              f={f}
            />
          ))}
        </ol>
      ) : (
        <p className="mt-8 rounded-xl bg-card px-6 py-16 text-center text-sm text-subtle">
          No record yet.
        </p>
      )}
    </PageTransition>
  );
}
