import type { ChargeTypeTotals, DcCurve } from "../charge-insights-data";
import {
  chargeInsightTotals,
  costPerKwh,
  curveLabels,
  curveRows,
} from "../charge-insights";
import {
  chargeHistory,
  chargeLegs,
  chargeTime,
  type LevelTime,
} from "../charge-time";
import type { Formatter } from "../format";
import type { PeriodId } from "../insights";
import type { ChargingPlace } from "../places-data";
import { buildChart } from "./chart";
import type {
  AppBlock,
  AppRecord,
  ChartColor,
  ChartDash,
  InsightPage,
} from "./contract";
import { chartBlock, panel, periodChoices, periodLabel } from "./panels";
import { heatmap } from "./stats";
import { appStat, appValue, statsWithValue } from "./values";

export type ChargingInsightsInput = {
  types: ChargeTypeTotals[];
  starts: { weekday: number; hour: number; drives: number }[];
  curves: DcCurve[];
  places: ChargingPlace[];
  drivenKm: number;
  levelTimes: LevelTime[];
  batteryLevel: number | null;
};

const curveColors: ChartColor[] = [
  "charge",
  "chart1",
  "chart4",
  "chart3",
  "chart5",
  "chart2",
];

const laterCurveDashes: ChartDash[] = ["dashed", "dotted", "dashDot"];

function curveDash(index: number): ChartDash | undefined {
  return index === 0
    ? undefined
    : laterCurveDashes[(index - 1) % laterCurveDashes.length];
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function typeStat(
  label: string,
  totals: ChargeTypeTotals | undefined,
  f: Formatter,
) {
  const perKwh = totals ? costPerKwh(totals.cost, totals.costedKwh) : null;
  return appStat(label, f.energy(totals?.addedKwh ?? 0), {
    detail: [
      plural(totals?.sessions ?? 0, "session", "sessions"),
      totals && totals.cost !== null ? f.cost(totals.cost) : null,
      perKwh === null ? null : `${f.cost(perKwh)} per kWh`,
    ]
      .filter(Boolean)
      .join(" · "),
  });
}

function chargeTimeBlocks(
  label: string,
  fast: boolean,
  input: ChargingInsightsInput,
  f: Formatter,
): AppBlock[] {
  const history = chargeHistory(input.levelTimes, fast);
  if (!history) return [];
  return [
    {
      kind: "note",
      role: "heading",
      text: `${label}: ${plural(history.sessions, "charge", "charges")}, ${history.from}% to ${history.to}%`,
    },
    {
      kind: "table",
      columns: ["Levels", "Typical", "Slow"],
      rows: chargeLegs(input.batteryLevel).map((leg) => {
        const time = chargeTime(input.levelTimes, fast, leg);
        return {
          key: `${fast ? "dc" : "ac"}-${leg.from}-${leg.to}`,
          cells: [
            appValue(`${leg.from}% → ${leg.to}%${leg.current ? " (now)" : ""}`),
            ...(time
              ? [
                  appValue(f.duration(time.typicalMin)),
                  appValue(f.duration(time.slowMin)),
                ]
              : [appValue("No record")]),
          ],
        };
      }),
    },
  ];
}

function placeRecord(place: ChargingPlace, f: Formatter): AppRecord {
  const perKwh = costPerKwh(place.cost, place.addedKwh);
  return {
    key: place.key,
    rank: null,
    title: place.label,
    badge: place.fast ? "DC" : "AC",
    value: f.energy(place.addedKwh),
    detail: [
      plural(place.sessions, "session", "sessions"),
      perKwh === null ? null : `${f.cost(perKwh)} per kWh`,
      place.cost === null ? null : f.cost(place.cost),
    ]
      .filter(Boolean)
      .join(" · "),
    note: null,
    bar: null,
    target: null,
    links: [],
  };
}

export function chargingInsightsPage(
  input: ChargingInsightsInput,
  period: PeriodId,
  sundayFirst: boolean,
  f: Formatter,
): InsightPage {
  const totals = chargeInsightTotals(input.types, input.drivenKm);
  const hundred = f.units.distance === "mi" ? 160.9344 : 100;
  const curves = curveRows(input.curves);
  const curveNames = curveLabels(curves.keys, f.date, f.clock);
  const base = {
    title: "Charging insights",
    subtitle: periodLabel(period),
    period,
    periods: periodChoices(),
  };
  if (totals.sessions === 0) {
    return {
      ...base,
      hero: [],
      heroBlocks: [{ kind: "note", text: "No charge in this period." }],
      sections: [],
    };
  }
  return {
    ...base,
    hero: statsWithValue([
      appStat("Sessions", String(totals.sessions)),
      appStat("Energy added", `${f.number(totals.addedKwh)} kWh`),
      appStat(
        "Cost per kWh",
        totals.perKwh === null ? "—" : f.cost(totals.perKwh),
        {
          detail:
            totals.cost === null ? null : `${f.cost(totals.cost)} in total`,
        },
      ),
      appStat(
        `Cost per 100 ${f.units.distance}`,
        totals.perKm === null ? "—" : f.cost((totals.perKm * hundred) / 100),
        { detail: `${f.distance(input.drivenKm)} driven` },
      ),
    ]),
    heroBlocks: [
      {
        kind: "stats",
        stats: [
          typeStat("AC charging", totals.ac, f),
          typeStat("DC fast charging", totals.dc, f),
        ],
      },
    ],
    sections: [
      {
        title: null,
        subtitle: null,
        period: false,
        panels: [
          panel("DC charging curves (kW)", [
            curves.keys.length > 0
              ? chartBlock(
                  buildChart({
                    title: "DC curves",
                    rows: curves.rows,
                    xKey: "level",
                    xFormat: "percent",
                    style: f.chartStyle,
                    left: "zero",
                    series: curves.keys.map((key, index) => ({
                      key: key.key,
                      label: curveNames[index]!,
                      unit: "kW",
                      color: curveColors[index % curveColors.length]!,
                      dash: curveDash(index),
                    })),
                  }),
                )
              : { kind: "note", text: "No DC fast charge in this period." },
          ]),
          panel(
            "Charging time",
            [
              ...chargeTimeBlocks("DC fast charging", true, input, f),
              ...chargeTimeBlocks("AC charging", false, input, f),
              input.levelTimes.length > 0 && {
                kind: "note",
                role: "caption",
                text: "The time that past charges spent at each battery percent. The slow time fits a cold battery or a busy charger.",
              },
            ],
            "Charges of the last 2 years",
          ),
          panel(
            "When the car charges",
            [heatmap(input.starts, sundayFirst, f, "charges")],
            "Charge starts",
          ),
          panel("Top charging places", [
            input.places.length > 0 && {
              kind: "records",
              rows: input.places.map((place) => placeRecord(place, f)),
            },
          ]),
        ],
      },
    ],
  };
}
