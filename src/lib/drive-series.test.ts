import { describe, expect, test } from "bun:test";
import { driveEnergy, sampleDrive, type DrivePoint } from "./drive-series";

function point(
  minute: number,
  powerKw: number | null,
  extra: Partial<DrivePoint> = {},
): DrivePoint {
  return {
    at: minute * 60_000,
    speedKmh: 50,
    powerKw,
    elevationM: 100,
    battery: 80,
    ...extra,
  };
}

describe("driveEnergy", () => {
  test("sums the energy used and the energy recovered", () => {
    const energy = driveEnergy([
      point(0, 20),
      point(1, 20),
      point(2, -20),
      point(3, -20),
    ]);
    expect(energy.usedKwh).toBeCloseTo(1 / 3, 6);
    expect(energy.recoveredKwh).toBeCloseTo(1 / 3, 6);
  });

  test("averages the power between two points", () => {
    expect(driveEnergy([point(0, 0), point(1, 30)]).usedKwh).toBeCloseTo(
      0.25,
      6,
    );
  });

  test("skips long gaps and missing power", () => {
    expect(driveEnergy([point(0, 30), point(10, 30)]).usedKwh).toBe(0);
    expect(driveEnergy([point(0, null), point(1, 30)]).usedKwh).toBe(0);
    expect(driveEnergy([point(0, 30)])).toEqual({
      usedKwh: 0,
      recoveredKwh: 0,
    });
  });
});

describe("sampleDrive", () => {
  test("keeps a short drive as it is", () => {
    const points = [point(0, 10), point(1, 20)];
    expect(sampleDrive(points, 10)).toBe(points);
  });

  test("averages each bucket and keeps the last battery level", () => {
    const points = Array.from({ length: 10 }, (_, index) =>
      point(index, index, { speedKmh: index * 10, battery: 90 - index }),
    );
    const sampled = sampleDrive(points, 5);
    expect(sampled).toHaveLength(5);
    expect(sampled[0]).toMatchObject({
      at: 0,
      speedKmh: 5,
      powerKw: 0.5,
      battery: 89,
    });
    expect(sampled[4]).toMatchObject({
      at: 8 * 60_000,
      speedKmh: 85,
      battery: 81,
    });
  });

  test("gives null for a bucket without values", () => {
    const points = Array.from({ length: 4 }, (_, index) =>
      point(index, null, { elevationM: null }),
    );
    expect(sampleDrive(points, 2)[0]).toMatchObject({
      powerKw: null,
      elevationM: null,
    });
  });
});
