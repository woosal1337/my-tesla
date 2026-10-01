import { describe, expect, test } from "bun:test";
import { routeBounds, sampleRoute, type LngLat } from "./route";

const line = (count: number): LngLat[] =>
  Array.from({ length: count }, (_, index) => [29 + index / 1000, 40]);

describe("sampleRoute", () => {
  test("keeps a short route unchanged", () => {
    const route = line(10);
    expect(sampleRoute(route, 20)).toBe(route);
  });

  test("reduces a long route and keeps the first and last point", () => {
    const route = line(2001);
    const sampled = sampleRoute(route, 500);
    expect(sampled).toHaveLength(500);
    expect(sampled[0]).toEqual(route[0]);
    expect(sampled.at(-1)).toEqual(route.at(-1));
  });

  test("keeps the order of the points", () => {
    const sampled = sampleRoute(line(1000), 50);
    const longitudes = sampled.map(([lng]) => lng);
    expect(longitudes).toEqual([...longitudes].sort((a, b) => a - b));
  });
});

describe("routeBounds", () => {
  test("gives no bounds for an empty route", () => {
    expect(routeBounds([])).toBeNull();
  });

  test("finds the south-west and north-east corners", () => {
    expect(
      routeBounds([
        [29.1, 40.9],
        [28.9, 41.2],
        [29.3, 40.7],
      ]),
    ).toEqual([
      [28.9, 40.7],
      [29.3, 41.2],
    ]);
  });
});
