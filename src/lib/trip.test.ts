import { describe, expect, test } from "bun:test";
import type { Charge, Drive } from "./queries";
import { tripItems, tripPresets, tripRange, tripTotals } from "./trip";

const zone = "America/Phoenix";
const now = new Date(Date.UTC(2026, 9, 2, 3, 0));

function drive(
  id: number,
  hour: number,
  distanceKm: number | null,
  efficiency: number | null,
): Drive {
  return {
    id,
    startAt: new Date(Date.UTC(2026, 8, 20, hour)),
    endAt: new Date(Date.UTC(2026, 8, 20, hour, 30)),
    from: "A",
    to: "B",
    distanceKm,
    durationMin: 30,
    efficiencyWhPerKm: efficiency,
    speedMaxKmh: 80,
    powerMaxKw: 50,
    powerMinKw: -20,
    ascentM: 10,
    descentM: 10,
    outsideTempAvg: 25,
    startLevel: 80,
    endLevel: 70,
  };
}

function charge(id: number, hour: number, cost: number | null): Charge {
  return {
    id,
    startAt: new Date(Date.UTC(2026, 8, 20, hour)),
    endAt: new Date(Date.UTC(2026, 8, 20, hour + 1)),
    place: "Home",
    energyAddedKwh: 20,
    startLevel: 40,
    endLevel: 80,
    durationMin: 60,
    cost,
    costEstimated: false,
    maxPowerKw: 11,
    fastCharger: false,
    latitude: null,
    longitude: null,
  };
}

describe("tripRange", () => {
  test("defaults to the last seven local days", () => {
    const range = tripRange(null, null, zone, now);
    if (range === "invalid") throw new Error("range");
    expect(range.from).toBe("2026-09-25");
    expect(range.to).toBe("2026-10-01");
    expect(range.start.toISOString()).toBe("2026-09-25T07:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-02T07:00:00.000Z");
  });

  test.each([
    ["2026-10-02", "2026-10-01"],
    ["2025-01-01", "2026-10-01"],
    ["2026-1-1", "2026-10-01"],
  ])("refuses %s to %s", (from, to) => {
    expect(tripRange(from, to, zone, now)).toBe("invalid");
  });
});

describe("tripPresets", () => {
  test("gives four ranges that end today", () => {
    expect(tripPresets(now, zone)).toEqual([
      { label: "Last 7 days", from: "2026-09-25", to: "2026-10-01" },
      { label: "Last 30 days", from: "2026-09-02", to: "2026-10-01" },
      { label: "This month", from: "2026-10-01", to: "2026-10-01" },
      { label: "This year", from: "2026-01-01", to: "2026-10-01" },
    ]);
  });
});

describe("tripTotals", () => {
  test("adds the drives and the charges", () => {
    const totals = tripTotals(
      [drive(1, 10, 100, 150), drive(2, 14, 50, null)],
      [charge(1, 12, 5), charge(2, 20, null)],
    );
    expect(totals).toMatchObject({
      drives: 2,
      charges: 2,
      distanceKm: 150,
      drivingMin: 60,
      chargingMin: 120,
      energyAddedKwh: 40,
      cost: 5,
    });
    expect(totals.energyUsedKwh).toBeCloseTo(15, 6);
    expect(totals.consumptionWhPerKm).toBeCloseTo(150, 6);
  });

  test("gives no cost and no consumption without data", () => {
    const totals = tripTotals(
      [drive(1, 10, null, null)],
      [charge(1, 12, null)],
    );
    expect(totals.cost).toBeNull();
    expect(totals.consumptionWhPerKm).toBeNull();
  });
});

describe("tripItems", () => {
  test("puts drives and charges in time order", () => {
    const items = tripItems(
      [drive(1, 14, 10, 150), drive(2, 9, 10, 150)],
      [charge(3, 11, 1)],
    );
    expect(
      items.map(
        (item) =>
          `${item.kind}-${item.kind === "drive" ? item.drive.id : item.charge.id}`,
      ),
    ).toEqual(["drive-2", "charge-3", "drive-1"]);
  });
});
