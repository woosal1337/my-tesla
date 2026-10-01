import { describe, expect, test } from "bun:test";
import { niceDomain } from "./nice-domain";

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
