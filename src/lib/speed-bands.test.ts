import { describe, expect, test } from "bun:test";
import { speedBands, speedEdges } from "./speed-bands";

describe("speedEdges", () => {
  test("gives the edges in the shown unit and in km/h", () => {
    expect(speedEdges("km").shown).toEqual([5, 30, 50, 70, 90, 110, 130]);
    const miles = speedEdges("mi");
    expect(miles.shown[1]).toBe(20);
    expect(miles.kmh[1]).toBeCloseTo(32.18688, 5);
  });
});

describe("speedBands", () => {
  const { shown } = speedEdges("km");

  test("turns power over speed into Wh/km and a time share", () => {
    const bands = speedBands(
      [
        { band: 2, points: 60, powerSum: 600, speedSum: 2400 },
        { band: 7, points: 40, powerSum: 1400, speedSum: 5600 },
      ],
      shown,
    );
    expect(bands).toEqual([
      { from: 30, to: 50, whPerKm: 250, share: 0.6 },
      { from: 130, to: null, whPerKm: 250, share: 0.4 },
    ]);
  });

  test("drops thin bands and bands outside the edges", () => {
    const bands = speedBands(
      [
        { band: 0, points: 50, powerSum: 10, speedSum: 100 },
        { band: 3, points: 5, powerSum: 10, speedSum: 300 },
        { band: 4, points: 45, powerSum: 900, speedSum: 3600 },
      ],
      shown,
    );
    expect(bands.map((band) => band.from)).toEqual([70]);
    expect(bands[0].share).toBeCloseTo(0.45, 6);
  });

  test("gives nothing without points", () => {
    expect(speedBands([], shown)).toEqual([]);
  });
});
