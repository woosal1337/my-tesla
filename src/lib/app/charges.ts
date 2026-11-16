import { assessChargingEfficiency, assessVoltage } from "../assessment";
import type { ChargeSession, CurvePoint } from "../charge-data";
import { chargeFigures, powerByLevel } from "../charge-figures";
import { chargesDayTotal } from "../day-total";
import type { Formatter } from "../format";
import type { Charge } from "../queries";
import { ongoingText } from "../vehicle";
import { buildChart } from "./chart";
import type {
  AppChart,
  ChargeDetail,
  ChargeList,
  LevelRange,
} from "./contract";
import { appStat, levelsText } from "./values";

export const unclosedNotice =
  "TeslaMate did not close this charge. This happens when TeslaMate restarts during a charge. The values come from the charge records.";

function levelsOf(start: number | null, end: number | null): LevelRange | null {
  return start === null || end === null ? null : { start, end };
}

export function chargeList(
  charges: Charge[],
  f: Formatter,
  now: Date,
): ChargeList {
  const totalKwh = charges.reduce(
    (sum, charge) => sum + (charge.energyAddedKwh ?? 0),
    0,
  );
  const costs = charges.flatMap((charge) =>
    charge.cost === null ? [] : [charge.cost],
  );
  return {
    summary: charges.length
      ? [
          `${charges.length} recent ${charges.length === 1 ? "charge" : "charges"}`,
          `${f.energy(totalKwh)} added`,
          ...(costs.length
            ? [`${f.cost(costs.reduce((sum, cost) => sum + cost, 0))} spent`]
            : []),
        ]
      : [],
    sections: f
      .groupByDay(charges, (charge) => charge.startAt, now)
      .map((group) => ({
        title: group.label,
        total: chargesDayTotal(group.items, f),
        rows: group.items.map((charge) => ({
          key: `charge-${charge.id}`,
          id: charge.id,
          clock: f.clock(charge.startAt),
          duration: charge.endAt ? f.duration(charge.durationMin) : "Now",
          place: charge.place,
          fast: charge.fastCharger,
          detail: [
            charge.startLevel !== null && charge.endLevel !== null
              ? levelsText(charge.startLevel, charge.endLevel)
              : charge.endAt
                ? "—"
                : null,
            charge.maxPowerKw
              ? `up to ${Math.round(charge.maxPowerKw)} kW`
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
          levels: levelsOf(charge.startLevel, charge.endLevel),
          energy:
            charge.energyAddedKwh === null && !charge.endAt
              ? null
              : `+${f.energy(charge.energyAddedKwh)}`,
          cost: charge.cost === null ? null : f.cost(charge.cost),
        })),
      })),
  };
}

function chargeCharts(curve: CurvePoint[], f: Formatter): AppChart[] {
  const style = f.chartStyle;
  const timeRows = curve.map((point) => ({
    at: point.at,
    battery: point.level,
    power: point.power,
    voltage: point.voltage,
    current: point.current,
  }));
  return [
    buildChart({
      title: "Power by battery level (kW)",
      rows: powerByLevel(curve),
      xKey: "level",
      xFormat: "percent",
      style,
      left: "zero",
      series: [
        {
          key: "power",
          label: "Power",
          unit: "kW",
          color: "charge",
          kind: "area",
          digits: 1,
        },
      ],
    }),
    buildChart({
      title: "Battery and power",
      rows: timeRows,
      xKey: "at",
      xFormat: "clock",
      style,
      left: "percent",
      leftFormat: "percent",
      right: "zero",
      series: [
        {
          key: "battery",
          label: "Battery",
          unit: "%",
          color: "chart1",
          kind: "area",
        },
        {
          key: "power",
          label: "Power",
          unit: "kW",
          color: "charge",
          axis: "right",
          digits: 1,
        },
      ],
    }),
    buildChart({
      title: "Voltage and current",
      rows: timeRows,
      xKey: "at",
      xFormat: "clock",
      style,
      right: "zero",
      series: [
        { key: "voltage", label: "Voltage", unit: "V", color: "chart4" },
        {
          key: "current",
          label: "Current",
          unit: "A",
          color: "chart1",
          axis: "right",
          digits: 1,
        },
      ],
    }),
  ].filter((chart): chart is AppChart => chart !== null);
}

export function chargeDetail(
  session: ChargeSession,
  curve: CurvePoint[],
  fullAt: Date | null,
  f: Formatter,
  now: Date,
  showMaps: boolean,
): ChargeDetail {
  const figures = chargeFigures(session, f);
  const { breakdown, rangeAdded, levelsAdded } = figures;
  const ongoing = session.endAt === null;
  const missing = ongoing ? ongoingText : "—";
  const added = session.energyAddedKwh;
  return {
    title: session.place,
    kind: figures.kind,
    fast: session.fast,
    subtitle: `${f.day(session.startAt, now)} ${f.clock(session.startAt)}${
      session.endAt ? ` to ${f.clock(session.endAt)}` : " · charging now"
    }`,
    fullAt: fullAt ? fullAt.toISOString() : null,
    notice: session.unclosed ? unclosedNotice : null,
    hero: [
      appStat(
        "Energy added",
        added === null ? missing : `+${f.number(added, 1)} kWh`,
      ),
      appStat(
        "Range added",
        rangeAdded === null
          ? missing
          : `+${f.number(Math.round(rangeAdded))} ${f.units.distance}`,
      ),
      appStat(
        "Peak power",
        session.maxPowerKw === null
          ? "—"
          : `${Math.round(session.maxPowerKw)} kW`,
      ),
      appStat(
        "Duration",
        session.durationMin === null
          ? missing
          : f.duration(session.durationMin),
      ),
    ],
    levels: levelsOf(session.startLevel, session.endLevel),
    stats: [
      appStat(
        "Average power",
        figures.averagePower === null
          ? missing
          : `${f.number(figures.averagePower, 1)} kW`,
      ),
      appStat(
        "Charging efficiency",
        figures.efficiency === null
          ? missing
          : `${Math.round(figures.efficiency)}%`,
        {
          assessment: assessChargingEfficiency(
            figures.efficiency,
            session.fast,
          ),
          detail: session.energyUsedKwh
            ? `${f.number(session.energyUsedKwh, 1)} kWh from the charger`
            : null,
        },
      ),
      appStat("Cost", session.cost === null ? missing : f.cost(session.cost), {
        detail:
          session.cost !== null
            ? figures.costSource
            : ongoing
              ? null
              : "Set a price in Settings on the web",
      }),
      appStat(
        "Voltage",
        session.avgVoltage === null
          ? "—"
          : `${Math.round(session.avgVoltage)} V`,
        {
          assessment: assessVoltage(session.avgVoltage, session.fast),
          detail:
            session.maxCurrent === null
              ? null
              : `up to ${Math.round(session.maxCurrent)} A`,
        },
      ),
      ...(figures.cable ? [appStat("Cable", figures.cable)] : []),
      ...(figures.batteryHeater
        ? [appStat("Battery heater", figures.batteryHeater)]
        : []),
    ],
    cost: breakdown
      ? {
          source: figures.costSource,
          note:
            [
              figures.tariff && `The price at this place: ${figures.tariff}.`,
              figures.estimatedFrom === "settings" &&
                "Change the price in Settings on the web.",
              figures.estimatedFrom === "geofence" &&
                "Change it in the geofence in TeslaMate.",
            ]
              .filter(Boolean)
              .join(" ") || null,
          stats: [
            appStat(
              "Energy billed",
              session.billedKwh === null
                ? "—"
                : `${f.number(session.billedKwh, 1)} kWh`,
              { detail: "From the charger" },
            ),
            appStat("Price per kWh", f.cost(breakdown.perKwhBilled), {
              detail: figures.perKwhSource,
            }),
            appStat("Per kWh in the battery", f.cost(breakdown.perKwhAdded), {
              detail:
                added === null ? null : `${f.number(added, 1)} kWh stored`,
            }),
            appStat("Charging losses", f.cost(breakdown.lossCost), {
              detail:
                breakdown.lossKwh === null
                  ? null
                  : `${f.number(breakdown.lossKwh, 1)} kWh not stored`,
            }),
            appStat(
              `Per 100 ${f.units.distance} of range`,
              f.cost(breakdown.per100Range),
              {
                detail:
                  rangeAdded === null
                    ? null
                    : `${f.number(Math.round(rangeAdded))} ${f.units.distance} added`,
              },
            ),
            appStat("Per 1% of battery", f.cost(breakdown.perLevel), {
              detail: levelsAdded === null ? null : `${levelsAdded}% added`,
            }),
          ],
        }
      : null,
    charts: chargeCharts(curve, f),
    location:
      showMaps && session.latitude !== null && session.longitude !== null
        ? { latitude: session.latitude, longitude: session.longitude }
        : null,
    previousId: session.previousId,
    nextId: session.nextId,
  };
}
