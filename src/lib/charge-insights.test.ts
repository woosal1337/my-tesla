import { describe, expect, test } from "bun:test";
import { costPer100Km, costPerKwh, curveRows } from "./charge-insights";

describe("curveRows", () => {
  test("puts each session in its own column, one row for each level", () => {
    const { rows, keys } = curveRows([
      {
        id: 7,
        startAt: new Date(0),
        points: [
          { level: 20, power: 170.04 },
          { level: 30, power: 150 },
        ],
      },
      {
        id: 9,
        startAt: new Date(1),
        points: [
          { level: 30, power: 120 },
          { level: 40, power: 100 },
        ],
      },
    ]);
    expect(keys.map((key) => key.key)).toEqual(["s7", "s9"]);
    expect(rows).toEqual([
      { level: 20, s7: 170, s9: null },
      { level: 30, s7: 150, s9: 120 },
      { level: 40, s7: null, s9: 100 },
    ]);
  });

  test("gives nothing for no sessions", () => {
    expect(curveRows([])).toEqual({ rows: [], keys: [] });
  });
});

describe("costs", () => {
  test("divide the cost by energy and by distance", () => {
    expect(costPerKwh(10, 40)).toBe(0.25);
    expect(costPer100Km(12, 400)).toBe(3);
  });

  test("give null without a cost or a base", () => {
    expect(costPerKwh(null, 40)).toBeNull();
    expect(costPerKwh(10, 0)).toBeNull();
    expect(costPer100Km(12, 0)).toBeNull();
  });
});
