import { describe, expect, test } from "bun:test";
import {
  chargeHistory,
  chargeLegs,
  chargeTime,
  chargeTimeTitle,
  type LevelTime,
} from "./charge-time";

function steps(
  fast: boolean,
  from: number,
  to: number,
  typicalS: number,
  slowS: number,
  sessions = 4,
): LevelTime[] {
  return Array.from({ length: to - from }, (_, index) => ({
    fast,
    level: from + index,
    sessions,
    typicalS,
    slowS,
  }));
}

describe("chargeLegs", () => {
  test("gives the three standard legs without a battery level", () => {
    expect(chargeLegs(null)).toEqual([
      { from: 10, to: 80, current: false },
      { from: 20, to: 80, current: false },
      { from: 80, to: 100, current: false },
    ]);
  });

  test("puts a leg from the battery level to 80 % first", () => {
    expect(chargeLegs(54)[0]).toEqual({ from: 54, to: 80, current: true });
    expect(chargeLegs(54)).toHaveLength(4);
  });

  test("goes to 100 % from a level of 80 % or more", () => {
    expect(chargeLegs(86)[0]).toEqual({ from: 86, to: 100, current: true });
  });

  test("marks a standard leg that starts at the battery level", () => {
    expect(chargeLegs(20)).toEqual([
      { from: 10, to: 80, current: false },
      { from: 20, to: 80, current: true },
      { from: 80, to: 100, current: false },
    ]);
  });

  test("adds no leg for a full battery", () => {
    expect(chargeLegs(100).some((leg) => leg.current)).toBe(false);
  });
});

describe("chargeTime", () => {
  const levels = [
    ...steps(true, 10, 80, 30, 45),
    ...steps(false, 20, 100, 300, 360),
  ];

  test("adds the time of each percent on the way", () => {
    expect(chargeTime(levels, true, { from: 20, to: 80 })).toEqual({
      typicalMin: 30,
      slowMin: 45,
    });
  });

  test("keeps the charger types apart", () => {
    expect(chargeTime(levels, false, { from: 20, to: 80 })).toEqual({
      typicalMin: 300,
      slowMin: 360,
    });
  });

  test("gives no time when one percent has no record", () => {
    expect(chargeTime(levels, true, { from: 80, to: 100 })).toBeNull();
    expect(chargeTime(levels, false, { from: 10, to: 80 })).toBeNull();
    const withGap = levels.filter((step) => !step.fast || step.level !== 40);
    expect(chargeTime(withGap, true, { from: 20, to: 80 })).toBeNull();
  });

  test("gives no time for an empty leg", () => {
    expect(chargeTime(levels, true, { from: 80, to: 80 })).toBeNull();
  });
});

describe("chargeHistory", () => {
  test("gives the sessions and the band of one charger type", () => {
    const levels = [
      ...steps(true, 12, 91, 30, 45, 9),
      ...steps(false, 20, 100, 300, 360, 3),
    ];
    expect(chargeHistory(levels, true)).toEqual({
      sessions: 9,
      from: 12,
      to: 91,
    });
    expect(chargeHistory(levels, false)).toEqual({
      sessions: 3,
      from: 20,
      to: 100,
    });
  });

  test("gives nothing without a record", () => {
    expect(chargeHistory([], true)).toBeNull();
  });
});

describe("chargeTimeTitle", () => {
  test("names the history range, because the panel ignores the period", () => {
    expect(chargeTimeTitle).toBe("Charging time, last 2 years");
  });
});
