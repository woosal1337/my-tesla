import { describe, expect, test } from "bun:test";
import { leakWarning, slowLeaks, type TireDay } from "./tire-leak";

function days(
  count: number,
  pressure: (index: number) => Omit<TireDay, "at">,
): TireDay[] {
  return Array.from({ length: count }, (_, index) => ({
    at: new Date(Date.UTC(2026, 8, 1 + index)),
    ...pressure(index),
  }));
}

describe("slowLeaks", () => {
  test("finds one tire that falls against the other three", () => {
    const leaks = slowLeaks(
      days(14, (index) => ({
        frontLeft: 2.9,
        frontRight: 2.9,
        rearLeft: 2.9 - index * 0.015,
        rearRight: 2.9,
      })),
    );
    expect(leaks).toHaveLength(1);
    expect(leaks[0].tire).toBe("rearLeft");
    expect(leaks[0].dropBar).toBeCloseTo(0.195, 6);
    expect(leaks[0].days).toBe(13);
  });

  test("ignores a drop on all four tires, such as a cold week", () => {
    const leaks = slowLeaks(
      days(14, (index) => {
        const value = 2.9 - index * 0.02;
        return {
          frontLeft: value,
          frontRight: value,
          rearLeft: value,
          rearRight: value,
        };
      }),
    );
    expect(leaks).toEqual([]);
  });

  test("ignores a small drop and too few days", () => {
    const small = days(14, (index) => ({
      frontLeft: 2.9,
      frontRight: 2.9,
      rearLeft: 2.9 - index * 0.005,
      rearRight: 2.9,
    }));
    expect(slowLeaks(small)).toEqual([]);
    const short = days(4, (index) => ({
      frontLeft: 2.9,
      frontRight: 2.9,
      rearLeft: 2.9 - index * 0.1,
      rearRight: 2.9,
    }));
    expect(slowLeaks(short)).toEqual([]);
  });

  test("skips days without all four values", () => {
    const leaks = slowLeaks(
      days(10, (index) => ({
        frontLeft: index === 3 ? null : 2.9,
        frontRight: 2.9,
        rearLeft: 2.9,
        rearRight: 2.9 - index * 0.02,
      })),
    );
    expect(leaks.map((leak) => leak.tire)).toEqual(["rearRight"]);
  });
});

describe("leakWarning", () => {
  test("names the tire, the drop, and the days", () => {
    expect(
      leakWarning(
        { tire: "rearLeft", dropBar: 0.2, days: 13 },
        (bar) => `${bar.toFixed(1)} bar`,
      ),
    ).toBe(
      "Rear left tire: down 0.2 bar against the other tires in 13 days. Check it for a slow leak.",
    );
  });
});
