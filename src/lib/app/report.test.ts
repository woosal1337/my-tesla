import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import type { Car, Charge, Drive } from "../queries";
import { buildTrips, tripPresets, tripRange } from "../trip";
import { reportPage } from "./report";

const f = createFormatter(defaultPreferences, "UTC");
const now = new Date("2026-10-18T12:00:00Z");

const car: Car = {
  id: 2,
  name: "Juniper",
  slug: "juniper",
  model: "Y",
  marketingName: null,
  exteriorColor: null,
  wheelType: null,
  trimBadging: null,
  efficiencyKwhPerKm: 0.136,
  lfpBattery: false,
  modelYear: null,
};

const at = (hour: number) => new Date(Date.UTC(2026, 9, 17, hour));

const drive: Drive = {
  id: 11,
  startAt: at(8),
  endAt: at(9),
  from: "Home",
  to: "Office",
  distanceKm: 40,
  durationMin: 60,
  efficiencyWhPerKm: 150,
  speedMaxKmh: 100,
  powerMaxKw: 120,
  powerMinKw: -40,
  ascentM: 10,
  descentM: 10,
  outsideTempAvg: 20,
  startLevel: 80,
  endLevel: 70,
  leftOpen: false,
};

const charge: Charge = {
  id: 77,
  startAt: at(18),
  endAt: at(19),
  place: "Home",
  energyAddedKwh: 20,
  startLevel: 60,
  endLevel: 80,
  durationMin: 60,
  maxPowerKw: 11,
  fastCharger: false,
  cost: 4,
  costEstimated: false,
  latitude: 33.4,
  longitude: -111.9,
};

const trips = buildTrips(
  [{ driveId: 11, tripId: 11, chargedBefore: false }],
  [drive],
  [],
);

describe("reportPage", () => {
  const range = tripRange("2026-10-12", "2026-10-18", "UTC", now);

  test("lists the trips and the charges of the range with totals and exports", () => {
    const page = reportPage(
      {
        range,
        presets: tripPresets(now, "UTC"),
        trips,
        drives: [drive],
        charges: [charge],
        routes: new Map([
          [
            11,
            [
              [-111.9, 33.4],
              [-111.8, 33.5],
            ],
          ],
        ]),
      },
      car,
      f,
      now,
    );
    expect(page.from).toBe("2026-10-12");
    expect(page.presets[0]?.label).toBe("Last 7 days");
    expect(page.stats[0]).toMatchObject({
      label: "Distance",
      value: { text: "40 km" },
    });
    expect(page.routes).toHaveLength(1);
    expect(page.markers).toMatchObject([{ kind: "charge", label: "Home" }]);
    expect(page.sections.map((section) => section.total)).toEqual([
      ["1 trip", "40 km", `+${f.energy(20)}`],
    ]);
    const rows = page.sections.flatMap((section) => section.rows);
    expect(rows.map((row) => row.target)).toEqual([
      { kind: "charge", id: 77 },
      { kind: "drive", id: 11 },
    ]);
    expect(page.exports.map((item) => item.path)).toEqual([
      "/api/cars/2/drives.csv?from=2026-10-12&to=2026-10-18",
      "/api/cars/2/charges.csv?from=2026-10-12&to=2026-10-18",
    ]);
    expect(page.notice).toBeNull();
  });

  test("leaves out the map with maps off and explains an empty or bad range", () => {
    const empty = reportPage(
      {
        range,
        presets: [],
        trips: [],
        drives: [],
        charges: [],
        routes: null,
      },
      car,
      f,
      now,
    );
    expect(empty.routes).toBeNull();
    expect(empty.notice).toBe("No drive and no charge in this range.");
    expect(empty.exports).toEqual([]);
    const bad = reportPage(
      {
        range: "invalid",
        presets: [],
        trips: [],
        drives: [],
        charges: [],
        routes: null,
      },
      car,
      f,
      now,
    );
    expect(bad.notice).toContain("366 days");
  });
});
