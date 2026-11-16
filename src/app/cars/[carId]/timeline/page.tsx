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
import { carPath } from "@/lib/car-slug";
import type { Formatter } from "@/lib/format";
import {
  dayWindow,
  localDayKey,
  parseDayKey,
  shiftDayKey,
} from "@/lib/insights";
import { dayRecords, lastActivityBefore } from "@/lib/timeline-data";
import {
  dayLegend,
  isQuietDay,
  lastActiveDay,
  timelineView,
  type TimelineRow,
} from "@/lib/timeline-view";
import { cn } from "@/lib/utils";
import { getFormatter } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Timeline" };

function ItemRow({
  row,
  basePath,
  f,
}: {
  row: TimelineRow;
  basePath: string;
  f: Formatter;
}) {
  const { item, time, title, detail, target } = row;
  const href =
    target?.kind === "drive"
      ? `${basePath}/drives/${target.id}`
      : target?.kind === "charge"
        ? `${basePath}/charging/${target.id}`
        : null;
  const icon: ReactNode =
    item.kind === "drive" ? (
      <Route className="size-4" />
    ) : item.kind === "charge" ? (
      <BatteryCharging className="size-4" />
    ) : (
      <Moon className="size-4" />
    );
  const dot =
    item.kind === "drive"
      ? "bg-primary text-primary-foreground"
      : item.kind === "charge"
        ? "bg-charge text-primary-foreground"
        : "bg-accent text-muted-foreground";
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
  const {
    segments,
    rows,
    drivenKm: driven,
    chargedKwh: charged,
    drivingMin,
    rest,
  } = timelineView(records, window, now, f);
  const quiet = isQuietDay(records);
  const lastActive = quiet
    ? lastActiveDay(await lastActivityBefore(car.id, window.start), f, now)
    : null;
  const base = carPath(car, "/timeline");
  const label = f.day(window.start, now);
  const restMetric = (
    <Metric
      label={rest.label}
      value={rest.percent}
      unit="%"
      detail={rest.detail}
    />
  );

  return (
    <PageTransition>
      <div className="pt-6 md:pt-10">
        <BackLink href={carPath(car)} label="Overview" />
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

      {lastActive && (
        <Link
          href={`${base}?day=${lastActive.day}`}
          transitionTypes={["tab-back"]}
          className="mt-8 flex items-center justify-between gap-4 rounded-xl bg-card px-5 py-4 transition-tesla hover:bg-accent"
        >
          <span>
            <span className="block font-medium">{lastActive.title}</span>
            <span className="block text-sm text-muted-foreground">
              {lastActive.detail}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-subtle" />
        </Link>
      )}

      {quiet ? (
        segments.length > 0 && (
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {restMetric}
          </dl>
        )
      ) : (
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          <Metric
            label="Driven"
            value={f.number(Math.round(f.distanceValue(driven) ?? 0))}
            unit={f.units.distance}
            detail={`${records.drives.length} ${records.drives.length === 1 ? "drive" : "drives"}`}
          />
          <Metric label="Driving time" value={f.duration(drivingMin)} />
          <Metric
            label="Charged"
            value={f.number(charged, 1)}
            unit="kWh"
            detail={`${records.charges.length} ${records.charges.length === 1 ? "session" : "sessions"}`}
          />
          {restMetric}
        </dl>
      )}

      <section className="mt-10 rounded-xl bg-card p-5 md:p-6">
        <DayStrip
          segments={segments}
          start={window.start}
          end={window.end}
          hourLabels={[0, 6, 12, 18, 24].map((hour) => f.hour(hour))}
          now={now}
        />
        <div className="mt-4">
          <DayStripLegend entries={dayLegend(window, now)} />
        </div>
      </section>

      {rows.length ? (
        <ol
          className={cn(
            "relative mt-8 space-y-1 before:absolute before:top-6 before:bottom-6 before:left-[1.75rem] before:w-px before:bg-border",
            f.settings.clock === "12h"
              ? "sm:before:left-[12.75rem]"
              : "sm:before:left-[9.75rem]",
          )}
        >
          {rows.map((row) => (
            <ItemRow
              key={`${row.item.kind}-${row.item.start.getTime()}`}
              row={row}
              basePath={carPath(car)}
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
