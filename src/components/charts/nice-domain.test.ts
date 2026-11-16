import { describe, expect, test } from "bun:test";
import { evenTicks, fitAxis, niceDomain, niceZeroDomain } from "./nice-domain";

describe("niceDomain", () => {
  test("puts five even ticks around the values", () => {
    expect(niceDomain([59.8, 60.6])).toEqual([59.5, 61.5]);
    expect(niceDomain([440, 446])).toEqual([435, 455]);
    expect(niceDomain([227, 231])).toEqual([226, 234]);
  });

  test("keeps every value inside the domain", () => {
    const values = [3.2, 97.4, 51];
    const [low, high] = niceDomain(values) ?? [0, 0];
    expect(low).toBeLessThanOrEqual(3.2);
    expect(high).toBeGreaterThanOrEqual(97.4);
  });

  test("gives a domain to one flat value", () => {
    const [low, high] = niceDomain([230, 230]) ?? [0, 0];
    expect(low).toBeLessThan(230);
    expect(high).toBeGreaterThan(230);
  });

  test("gives no domain without values", () => {
    expect(niceDomain([])).toBeUndefined();
  });
});

describe("niceZeroDomain", () => {
  test("starts at zero and ends close above the largest value", () => {
    expect(niceZeroDomain([0, 118])).toEqual([0, 125]);
    expect(niceZeroDomain([12, 76])).toEqual([0, 80]);
    expect(niceZeroDomain([0.4])).toEqual([0, 0.5]);
  });

  test("falls back to the even domain for negative values", () => {
    expect(niceZeroDomain([-40, 120])).toEqual(niceDomain([-40, 120]));
  });

  test("gives no domain without values", () => {
    expect(niceZeroDomain([])).toBeUndefined();
  });
});

describe("evenTicks", () => {
  test("splits a domain into even steps", () => {
    expect(evenTicks([0, 125])).toEqual([0, 25, 50, 75, 100, 125]);
    expect(evenTicks([0, 80])).toEqual([0, 20, 40, 60, 80]);
    expect(evenTicks([59.5, 61.5])).toEqual([59.5, 60, 60.5, 61, 61.5]);
  });
});

describe("fitAxis", () => {
  test("fits the values with the smallest nice range", () => {
    const domainOf = (values: number[]) => fitAxis(values)?.domain;
    expect(domainOf([265, 340])).toEqual([260, 360]);
    expect(domainOf([2400, 4100])).toEqual([2000, 4500]);
    expect(domainOf([440, 446])).toEqual([438, 448]);
    expect(domainOf([2.7, 2.98])).toEqual([2.6, 3]);
    expect(domainOf([0.2, 5])).toEqual([0, 6]);
    expect(domainOf([-12, 55])).toEqual([-20, 60]);
    expect(fitAxis([265, 340])?.ticks).toEqual([260, 280, 300, 320, 340, 360]);
  });

  test("keeps the values inside and fills at least 40% of the axis", () => {
    for (const low of [-75, -3.2, 0, 0.4, 7, 61, 265, 2400, 18_000]) {
      for (const width of [0.3, 1, 6, 17, 75, 230, 1700, 9000]) {
        const fit = fitAxis([low, low + width])!;
        const [start, end] = fit.domain;
        const step = fit.ticks[1]! - fit.ticks[0]!;
        expect(start).toBeLessThanOrEqual(low);
        expect(end).toBeGreaterThanOrEqual(low + width);
        expect(width / (end - start)).toBeGreaterThanOrEqual(0.4);
        for (const tick of fit.ticks) {
          const steps = tick / step;
          expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-4);
        }
      }
    }
  });

  test("starts at or above zero for values at or above zero", () => {
    expect(fitAxis([0.2, 5])?.domain[0]).toBe(0);
    expect(fitAxis([3, 90])?.domain[0]).toBeGreaterThanOrEqual(0);
  });

  test("gives no axis without values", () => {
    expect(fitAxis([])).toBeUndefined();
  });
});
