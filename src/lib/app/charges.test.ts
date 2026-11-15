import { describe, expect, test } from "bun:test";
import type { ChargeSession, CurvePoint } from "../charge-data";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import type { Charge } from "../queries";
import { chargeDetail, chargeList, unclosedNotice } from "./charges";

const f = createFormatter(defaultPreferences, "Europe/Istanbul");
const now = new Date("2026-10-17T15:00:00Z");

const charge: Charge = {
  id: 7,
  startAt: new Date("2026-10-17T06:00:00Z"),
  endAt: new Date("2026-10-17T07:30:00Z"),
  place: "Home",
  energyAddedKwh: 16.5,
  startLevel: 52,
  endLevel: 80,
  durationMin: 90,
  maxPowerKw: 11,
  fastCharger: false,
  cost: 80.1,
  costEstimated: true,
  latitude: 40.7,
  longitude: 29.9,
};

const session: ChargeSession = {
  id: 9,
  startAt: new Date("2026-10-17T10:00:00Z"),
  endAt: new Date("2026-10-17T10:30:00Z"),
  place: "Supercharger Bolu",
  latitude: 40.7,
  longitude: 31.6,
  energyAddedKwh: 40,
  energyUsedKwh: 44,
  startLevel: 20,
  endLevel: 80,
  startRangeKm: 90,
  endRangeKm: 360,
  durationMin: 30,
  outsideTempAvg: 15,
  cost: 440,
  costEstimated: false,
  price: null,
  billedKwh: 44,
  unclosed: false,
  fast: true,
  brand: "Tesla",
  connector: null,
  maxPowerKw: 172.4,
  avgVoltage: 398,
  maxCurrent: 410,
  phases: null,
  costBasis: "recorded",
  billingType: null,
  costPerUnit: null,
  sessionFee: null,
  cable: null,
  batteryHeater: null,
  previousId: 8,
  nextId: null,
};

const curve: CurvePoint[] = [20, 40, 60, 80].map((level, index) => ({
  at: session.startAt.getTime() + index * 10 * 60_000,
  level,
  power: [170, 120, 80, 40][index]!,
  voltage: 398,
  current: 300,
  rangeKm: null,
}));

describe("chargeList", () => {
  test("groups charges by day and marks one in progress", () => {
    const list = chargeList(
      [{ ...charge, id: 8, endAt: null, energyAddedKwh: null }, charge],
      f,
      now,
    );
    expect(list.summary).toEqual([
      "2 recent charges",
      "16.5 kWh added",
      "160.20 spent",
    ]);
    expect(list.sections[0]!.total).toEqual(["+16.5 kWh"]);
    const [ongoing, done] = list.sections[0]!.rows;
    expect(ongoing).toMatchObject({ duration: "Now", energy: null });
    expect(done).toMatchObject({
      clock: "09:00",
      duration: "1 h 30 min",
      detail: "52% → 80% · up to 11 kW",
      levels: { start: 52, end: 80 },
      energy: "+16.5 kWh",
      cost: "80.10",
    });
  });
});

describe("chargeDetail", () => {
  test("gives the figures, the cost breakdown, and three charts", () => {
    const detail = chargeDetail(session, curve, null, f, now, true);
    expect(detail.kind).toBe("Tesla DC fast charge");
    expect(detail.hero.map((stat) => stat.value.text)).toEqual([
      "+40.0 kWh",
      "+270 km",
      "172 kW",
      "30 min",
    ]);
    expect(detail.cost?.source).toBe("Recorded in TeslaMate");
    expect(detail.charts.map((chart) => chart.title)).toEqual([
      "Power by battery level (kW)",
      "Battery and power",
      "Voltage and current",
    ]);
    expect([detail.previousId, detail.nextId]).toEqual([8, null]);
    expect(detail.location).toEqual({ latitude: 40.7, longitude: 31.6 });
  });

  test("notes a charge that TeslaMate left open, and hides the map", () => {
    const detail = chargeDetail(
      { ...session, unclosed: true, cost: null },
      [],
      null,
      f,
      now,
      false,
    );
    expect(detail.notice).toBe(unclosedNotice);
    expect(detail.cost).toBeNull();
    expect(detail.charts).toEqual([]);
    expect(detail.location).toBeNull();
  });
});
