import { describe, expect, test } from "bun:test";
import { createFormatter } from "./format";
import { defaultPreferences } from "./preferences";
import type { Charge, Drive } from "./queries";
import {
  chargeHeader,
  chargeRow,
  csvFileName,
  driveHeader,
  driveRow,
  exportRange,
  localStamp,
} from "./trip-log";

const zone = "America/Phoenix";
const metric = createFormatter(defaultPreferences, zone);
const imperial = createFormatter(
  { ...defaultPreferences, distance: "mi", temperature: "f" },
  zone,
);

const drive: Drive = {
  id: 140,
  startAt: new Date(Date.UTC(2026, 8, 20, 22, 26)),
  endAt: new Date(Date.UTC(2026, 8, 20, 23, 10)),
  from: "Saguaro Lake",
  to: "Home",
  distanceKm: 50.123,
  durationMin: 44,
  efficiencyWhPerKm: 137.456,
  speedMaxKmh: 80.4,
  powerMaxKw: 19,
  powerMinKw: -7,
  ascentM: 27,
  descentM: 90,
  outsideTempAvg: 30.04,
  startLevel: 44,
  endLevel: 32,
};

const charge: Charge = {
  id: 15,
  startAt: new Date(Date.UTC(2026, 8, 9, 18, 40)),
  endAt: null,
  place: "Supercharger Flagstaff",
  energyAddedKwh: 32.004,
  startLevel: 25,
  endLevel: 78,
  durationMin: 22,
  cost: 16.171,
  costEstimated: false,
  maxPowerKw: 170.04,
  fastCharger: true,
  latitude: null,
  longitude: null,
};

describe("localStamp", () => {
  test("writes the local time", () => {
    expect(localStamp(drive.startAt, zone)).toBe("2026-09-20 15:26");
    expect(localStamp(null, zone)).toBeNull();
  });
});

describe("exportRange", () => {
  test("is empty without dates", () => {
    expect(exportRange(null, null, zone)).toBeNull();
  });

  test("covers whole local days", () => {
    const range = exportRange("2026-09-01", "2026-09-30", zone);
    if (!range || range === "invalid") throw new Error("range");
    expect(range.start.toISOString()).toBe("2026-09-01T07:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-01T07:00:00.000Z");
  });

  test.each([
    ["2026-9-1", null],
    ["2026-09-30", "2026-09-01"],
  ])("refuses %s to %s", (from, to) => {
    expect(exportRange(from, to, zone)).toBe("invalid");
  });
});

describe("drive rows", () => {
  test("use the units of the settings", () => {
    expect(driveHeader(metric)).toContain("Distance (km)");
    expect(driveHeader(imperial)).toContain("Distance (mi)");
    expect(driveHeader(imperial)).toContain("Outside (°F)");
    expect(driveRow(drive, metric)).toEqual([
      "2026-09-20 15:26",
      "2026-09-20 16:10",
      "Saguaro Lake",
      "Home",
      50.12,
      44,
      137.46,
      44,
      32,
      80,
      30,
      27,
      90,
    ]);
    const row = driveRow(drive, imperial);
    expect(row[4]).toBe(31.14);
    expect(row[10]).toBe(86.1);
    expect(row[11]).toBe(89);
  });
});

describe("charge rows", () => {
  test("name the currency and the charger type", () => {
    expect(chargeHeader("USD").slice(-2)).toEqual([
      "Cost (USD)",
      "Cost source",
    ]);
    expect(chargeHeader(null).at(-2)).toBe("Cost");
    expect(chargeRow(charge, zone)).toEqual([
      "2026-09-09 11:40",
      null,
      "Supercharger Flagstaff",
      "DC",
      32,
      25,
      78,
      22,
      170,
      16.17,
      "TeslaMate",
    ]);
    expect(
      chargeRow({ ...charge, cost: 9.5, costEstimated: true }, zone).at(-1),
    ).toBe("Estimate");
    expect(chargeRow({ ...charge, cost: null }, zone).slice(-2)).toEqual([
      null,
      null,
    ]);
  });
});

describe("csvFileName", () => {
  test("uses a slug of the car name", () => {
    expect(
      csvFileName("drives", "Juniper", new Date(Date.UTC(2026, 9, 2))),
    ).toBe("my-tesla-juniper-drives-2026-10-02.csv");
    expect(
      csvFileName("charges", "Ünal's Y", new Date(Date.UTC(2026, 9, 2))),
    ).toBe("my-tesla-nal-s-y-charges-2026-10-02.csv");
  });
});
