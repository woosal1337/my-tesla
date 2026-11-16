import { assessConsumption, ratedWhPerKm } from "../assessment";
import type { Formatter } from "../format";
import { bucketUnit, weekGrid, type PeriodId } from "../insights";
import type { Preferences } from "../preferences";
import type { Car } from "../queries";
import { speedBands, speedEdges, type SpeedBandRow } from "../speed-bands";
import type {
  ChargeTotals,
  DriveTotals,
  EfficiencyPoint,
  LongDrive,
  PressurePoint,
  SoftwareUpdate,
  StatsBucket,
} from "../stats-data";
import {
  bucketRows,
  efficiencyBands,
  efficiencyScatter,
  pressureRows,
  softwareTitle,
  statsTotals,
  updateDays,
} from "../stats-figures";
import { leakWarning, type SlowLeak } from "../tire-leak";
import { odometerRows, type OdometerPoint } from "../trends";
import { efficiencyDigits } from "../units";
import { buildChart } from "./chart";
import type { AppBlock, InsightPage } from "./contract";
import { chartBlock, panel, periodChoices, periodLabel } from "./panels";
import { appStat } from "./values";

export type StatsInput = {
  buckets: StatsBucket[];
  drives: DriveTotals;
  charges: ChargeTotals;
  efficiency: EfficiencyPoint[];
  starts: { weekday: number; hour: number; drives: number }[];
  pressure: PressurePoint[];
  updates: SoftwareUpdate[];
  longest: LongDrive[];
  speedRows: SpeedBandRow[];
  leaks: SlowLeak[];
  odometer: OdometerPoint[];
};

type StatsSettings = Pick<
  Preferences,
  | "weekStart"
  | "temperature"
  | "pressure"
  | "currency"
  | "distance"
  | "efficiency"
>;

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pressureTooltipDigits = { bar: 2, psi: 1, kpa: 0 };

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function heatmap(
  starts: StatsInput["starts"],
  sundayFirst: boolean,
  f: Formatter,
  unit = "drives",
): AppBlock {
  const grid = weekGrid(starts);
  const order = sundayFirst ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
  return {
    kind: "heatmap",
    rows: order.map((day) => ({
      label: weekdays[day]!,
      values: grid[day] ?? [],
    })),
    hours: [0, 6, 12, 18, 24].map((hour) => f.hour(hour)),
    max: Math.max(1, ...grid.flat()),
    unit,
  };
}

export function statsHero(
  drives: DriveTotals,
  charges: ChargeTotals,
  car: Car,
  f: Formatter,
): Pick<InsightPage, "hero" | "heroBlocks"> {
  const { whPerKm, distanceTotal, costPer100 } = statsTotals(
    drives,
    charges.cost,
    f,
  );
  return {
    hero: [
      appStat("Distance", `${f.number(distanceTotal)} ${f.units.distance}`, {
        detail: plural(drives.drives, "drive", "drives"),
      }),
      appStat("Driving time", f.duration(drives.minutes)),
      appStat("Energy used", `${f.number(drives.usedKwh)} kWh`),
      appStat("Efficiency", f.efficiency(whPerKm), {
        assessment: assessConsumption(
          whPerKm,
          ratedWhPerKm(car),
          f,
          drives.distanceKm,
        ),
      }),
    ],
    heroBlocks: [
      {
        kind: "stats",
        stats: [
          appStat("Charged", `${f.number(charges.addedKwh)} kWh`, {
            detail: plural(charges.sessions, "session", "sessions"),
          }),
          appStat("Charging cost", f.cost(charges.cost), {
            detail:
              costPer100 === null
                ? null
                : `${f.cost(costPer100)} per 100 ${f.units.distance}`,
          }),
          appStat(
            "Top speed",
            drives.speedMaxKmh === null
              ? "—"
              : `${f.number(f.speedValue(drives.speedMaxKmh) ?? 0)} ${f.units.speed}`,
          ),
          appStat(
            "Longest drive",
            drives.longestKm === null
              ? "—"
              : `${f.number(f.distanceValue(drives.longestKm) ?? 0)} ${f.units.distance}`,
          ),
        ],
      },
    ],
  };
}

export function statsPage(
  input: StatsInput,
  car: Car,
  settings: StatsSettings,
  period: PeriodId,
  f: Formatter,
  now: Date,
): InsightPage {
  const { drives, charges } = input;
  const unit = bucketUnit(period);
  const bucketNote = `Per ${unit}`;
  const odometerSeries = odometerRows(input.odometer, f);
  const xFormat = unit === "month" ? "month" : "day";
  const rows = bucketRows(input.buckets, f);
  const style = f.chartStyle;
  const bucketChart = (
    title: string,
    series: Parameters<typeof buildChart>[0]["series"],
    left: "zero" | "auto" = "zero",
  ) => buildChart({ title, rows, xKey: "at", xFormat, style, series, left });
  const temperatureBandRows = efficiencyBands(
    input.efficiency,
    f,
    settings.temperature === "f",
  );
  const speeds = speedBands(
    input.speedRows,
    speedEdges(settings.distance).shown,
  );
  const scatter = efficiencyScatter(input.efficiency, f).sort(
    (a, b) => a.x - b.x,
  );
  const pressureDigits = pressureTooltipDigits[settings.pressure];
  const tires = [
    ["frontLeft", "Front left", "chart1", "solid"],
    ["frontRight", "Front right", "chart3", "dashed"],
    ["rearLeft", "Rear left", "chart4", "dotted"],
    ["rearRight", "Rear right", "charge", "dashDot"],
  ] as const;

  return {
    title: "Stats",
    subtitle: periodLabel(period),
    period,
    periods: periodChoices(),
    ...statsHero(drives, charges, car, f),
    sections: [
      {
        title: null,
        subtitle: null,
        period: false,
        panels: [
          panel(
            `Distance (${f.units.distance})`,
            [
              drives.drives > 0 &&
                chartBlock(
                  bucketChart("Distance", [
                    {
                      key: "distance",
                      label: "Distance",
                      unit: f.units.distance,
                      color: "chart1",
                      kind: "bar",
                      digits: 1,
                    },
                  ]),
                ),
            ],
            bucketNote,
          ),
          panel(`Odometer (${f.units.distance})`, [
            odometerSeries.length > 1 &&
              chartBlock(
                buildChart({
                  title: "Odometer",
                  rows: odometerSeries,
                  xKey: "at",
                  xFormat: "day",
                  style,
                  series: [
                    {
                      key: "odometer",
                      label: "Odometer",
                      unit: f.units.distance,
                      color: "chart1",
                    },
                  ],
                }),
              ),
          ]),
          panel(
            "Energy (kWh)",
            [
              (drives.drives > 0 || charges.sessions > 0) &&
                chartBlock(
                  bucketChart("Energy", [
                    {
                      key: "used",
                      label: "Used",
                      unit: "kWh",
                      color: "chart1",
                      kind: "bar",
                      digits: 1,
                    },
                    {
                      key: "charged",
                      label: "Charged",
                      unit: "kWh",
                      color: "charge",
                      kind: "bar",
                      digits: 1,
                    },
                  ]),
                ),
            ],
            bucketNote,
          ),
          ...(charges.cost === null
            ? []
            : [
                panel(
                  settings.currency === "none"
                    ? "Charging cost"
                    : `Charging cost (${settings.currency})`,
                  [
                    chartBlock(
                      bucketChart("Charging cost", [
                        {
                          key: "cost",
                          label: "Cost",
                          unit: "",
                          color: "charge",
                          kind: "bar",
                          digits: 2,
                        },
                      ]),
                    ),
                  ],
                  [
                    bucketNote,
                    charges.estimatedCosts
                      ? `${charges.estimatedCosts} of ${charges.sessions} charges from your price`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                ),
              ]),
          panel(
            `Temperature (${f.units.temperature})`,
            [
              chartBlock(
                bucketChart(
                  "Temperature",
                  [
                    {
                      key: "outside",
                      label: "Outside",
                      unit: f.units.temperature,
                      color: "chart1",
                      digits: 1,
                    },
                    {
                      key: "cabin",
                      label: "Cabin",
                      unit: f.units.temperature,
                      color: "chart4",
                      digits: 1,
                    },
                  ],
                  "auto",
                ),
              ),
            ],
            `Average while driving, per ${unit}`,
          ),
          panel(`Efficiency (${f.units.efficiency}) and temperature`, [
            scatter.length > 2 &&
              chartBlock(
                buildChart({
                  title: "Efficiency and temperature",
                  rows: scatter,
                  xKey: "x",
                  xFormat: "number",
                  xUnit: f.units.temperature,
                  style,
                  series: [
                    {
                      key: "y",
                      label: "Efficiency",
                      unit: f.units.efficiency,
                      color: "chart1",
                      kind: "dot",
                      digits: efficiencyDigits(settings),
                    },
                  ],
                }),
              ),
          ]),
          panel(
            "By temperature",
            [
              temperatureBandRows.length > 0 && {
                kind: "shares",
                rows: temperatureBandRows.map((band) => ({
                  label: `${band.from} to ${band.to} ${f.units.temperature}`,
                  share: band.share,
                  text: `${f.distance(band.distanceKm)} · ${f.efficiency(band.whPerKm)}`,
                  color: "primary",
                })),
              },
            ],
            temperatureBandRows.length ? "Share of distance" : null,
          ),
          panel(
            "By speed",
            [
              speeds.length > 0 && {
                kind: "shares",
                rows: speeds.map((band) => ({
                  label:
                    band.to === null
                      ? `${band.from}+ ${f.units.speed}`
                      : `${band.from} to ${band.to} ${f.units.speed}`,
                  share: band.share,
                  text: `${Math.round(band.share * 100)}% · ${f.efficiency(band.whPerKm)}`,
                  color: "primary",
                })),
              },
            ],
            speeds.length ? "Share of driving time" : null,
          ),
          panel(
            "When the car drives",
            [
              drives.drives > 0 &&
                heatmap(input.starts, settings.weekStart === "sunday", f),
            ],
            drives.drives ? "Drive starts" : null,
          ),
          panel("Longest drives", [
            input.longest.length > 0 && {
              kind: "records",
              rows: input.longest.map((drive, index) => ({
                key: String(drive.id),
                rank: index + 1,
                title: `${drive.from} → ${drive.to}`,
                badge: null,
                value: f.distance(drive.distanceKm),
                detail: `${f.day(drive.startAt, now)} · ${f.duration(drive.durationMin)}`,
                note: null,
                bar: null,
                target: { kind: "drive", id: drive.id },
                links: [],
              })),
            },
          ]),
          panel(`Tire pressure (${f.units.pressure})`, [
            chartBlock(
              buildChart({
                title: "Tire pressure",
                rows: pressureRows(input.pressure, f),
                xKey: "at",
                xFormat: "day",
                style,
                series: tires.map(([key, label, color, dash]) => ({
                  key,
                  label,
                  unit: f.units.pressure,
                  color,
                  dash,
                  digits: pressureDigits,
                })),
              }),
            ),
            ...input.leaks.map((leak): AppBlock => ({
              kind: "notice",
              text: leakWarning(leak, (bar) => f.pressure(bar)),
            })),
          ]),
          panel(softwareTitle, [
            input.updates.length > 0 && {
              kind: "records",
              rows: updateDays(input.updates, now).map(
                ({ update, days }, index) => ({
                  key: String(update.startAt.getTime()),
                  rank: null,
                  title: update.version,
                  badge: null,
                  value: `${index === 0 ? "Current · " : ""}${plural(days, "day", "days")}`,
                  detail: `${f.day(update.startAt, now)}${
                    update.endAt
                      ? ` · ${f.duration((update.endAt.getTime() - update.startAt.getTime()) / 60_000)} to install`
                      : ""
                  }`,
                  note: null,
                  bar: null,
                  target: null,
                  links: [],
                }),
              ),
            },
          ]),
        ],
      },
    ],
  };
}
