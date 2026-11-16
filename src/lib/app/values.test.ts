import { describe, expect, test } from "bun:test";
import { appStat, hasValue, statsWithValue } from "./values";

describe("hasValue", () => {
  test("is false for a text without a letter or a digit", () => {
    for (const text of ["—", "—% → —%", ""]) expect(hasValue(text)).toBe(false);
  });

  test("is true for a number, a partial range, and a word", () => {
    for (const text of ["0", "2.88", "—% → 80%", "No record"]) {
      expect(hasValue(text)).toBe(true);
    }
  });
});

describe("statsWithValue", () => {
  test("drops a stat without a value unless a detail gives the reason", () => {
    const kept = statsWithValue([
      appStat("Distance", "12 km"),
      appStat("Charging cost", "—"),
      appStat("Cost", "—", { detail: "Set a price in Settings on the web" }),
    ]);
    expect(kept.map((stat) => stat.label)).toEqual(["Distance", "Cost"]);
  });
});
