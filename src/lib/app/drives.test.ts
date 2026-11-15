import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import type { Car, Charge, Drive } from "../queries";
import { buildTrips } from "../trip";
import { driveDetail, driveList, leftOpenNotice, tripDetail } from "./drives";

const f = createFormatter(defaultPreferences, "Europe/Istanbul");
const now = new Date("2026-10-17T15:00:00Z");

const car: Car = {
  id: 2,
  name: "Rika",
  slug: "rika",
  model: "Y",
  marketingName: null,
  exteriorColor: null,
  wheelType: null,
  trimBadging: null,
  efficiencyKwhPerKm: 0.136,
  lfpBattery: false,
  modelYear: null,
};

function at(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 9, 17, hour, minute));
}

function drive(
  id: number,
  start: Date,
  end: Date,
  from: string,
  to: string,
): Drive {
  return {
    id,
    startAt: start,
    endAt: end,
    from,
    to,
    distanceKm: 120,
    durationMin: (end.getTime() - start.getTime()) / 60_000,
    efficiencyWhPerKm: 150,
    speedMaxKmh: 131,
    powerMaxKw: 180,
    powerMinKw: -60,
    ascentM: 420,
    descentM: 380,
    outsideTempAvg: 18,
    startLevel: 90,
    endLevel: 55,
    leftOpen: false,
  };
}

const charge: Charge = {
  id: 77,
  startAt: at(8, 5),
  endAt: at(8, 35),
  place: "Supercharger Bolu",
  energyAddedKwh: 30,
  startLevel: 30,
  endLevel: 75,
  durationMin: 30,
  maxPowerKw: 170,
  fastCharger: true,
  cost: 312,
  costEstimated: false,
  latitude: 40.7,
  longitude: 31.6,
};

const road = [
  drive(11, at(6), at(8), "Istanbul", "Bolu"),
  drive(12, at(8, 40), at(10, 30), "Bolu", "Ankara"),
];
const errand = drive(13, at(12), at(12, 20), "Ankara", "Market");

const trips = buildTrips(
  [
    { driveId: 11, tripId: 11, chargedBefore: false },
    { driveId: 12, tripId: 11, chargedBefore: true },
    { driveId: 13, tripId: 13, chargedBefore: false },
  ],
  [...road, errand],
  [charge],
).reverse();

describe("driveList", () => {
  test("groups trips by day and links a one-drive trip to its drive", () => {
    const list = driveList(trips, car, f, now);
    expect(list.summary).toEqual(["2 recent trips", "360 km"]);
    expect(list.sections).toHaveLength(1);
    expect(list.sections[0]!.total).toEqual(["2 trips", "360 km"]);
    const [errandRow, roadRow] = list.sections[0]!.rows;
    expect(errandRow?.target).toEqual({ kind: "drive", id: 13 });
    expect(roadRow).toMatchObject({
      target: { kind: "trip", id: 11 },
      clock: "09:00",
      title: "Ankara",
      subtitle: "from Istanbul · 1 stop, 1 with a charge",
      distance: "240 km",
    });
    expect(roadRow?.segments.map((segment) => segment.kind)).toEqual([
      "drive",
      "charge",
      "drive",
    ]);
  });

  test("colors a consumption above the usual range", () => {
    const thirsty = buildTrips(
      [{ driveId: 13, tripId: 13, chargedBefore: false }],
      [{ ...errand, efficiencyWhPerKm: 260 }],
      [],
    );
    const [row] = driveList(thirsty, car, f, now).sections[0]!.rows;
    expect(row?.consumption.tone).toBe("bad");
    expect(row?.consumption.note).toContain("rated value");
  });

  test("gives no summary without trips", () => {
    expect(driveList([], car, f, now)).toEqual({ summary: [], sections: [] });
  });
});

describe("driveDetail", () => {
  const found = {
    drive: { ...road[0]!, leftOpen: true },
    route: [
      [29, 41],
      [31.6, 40.7],
    ] as [number, number][],
    series: [
      {
        at: at(6).getTime(),
        speedKmh: 0,
        powerKw: 5,
        elevationM: 40,
        battery: 90,
      },
      {
        at: at(7).getTime(),
        speedKmh: 110,
        powerKw: 40,
        elevationM: 600,
        battery: 70,
      },
      {
        at: at(8).getTime(),
        speedKmh: 20,
        powerKw: -30,
        elevationM: 700,
        battery: 55,
      },
    ],
    energy: { usedKwh: 18.2, recoveredKwh: 1.4 },
  };

  test("names the drive, warns about an open drive, and builds three charts", () => {
    const detail = driveDetail(found, car, f, now, true);
    expect(detail.title).toBe("Bolu");
    expect(detail.subtitle).toBe(
      "from Istanbul · Today 09:00 to 11:00 · 18 °C outside",
    );
    expect(detail.notice).toBe(leftOpenNotice);
    expect(detail.charts.map((chart) => chart.title)).toEqual([
      "Speed and power",
      "Elevation (m)",
      "Battery (%)",
    ]);
    expect(detail.stats.find((stat) => stat.label === "Battery")).toEqual({
      label: "Battery",
      value: { text: "90% → 55%", tone: null, note: null },
      detail: "35 points used",
    });
    expect(detail.gpxPath).toBe("/api/cars/2/drives/11.gpx");
  });

  test("leaves out the route when maps are hidden", () => {
    expect(driveDetail(found, car, f, now, false).route).toBeNull();
  });
});

describe("tripDetail", () => {
  test("lists the legs and the charging stop with their targets", () => {
    const routes = new Map([
      [
        11,
        [
          [29, 41],
          [31.6, 40.7],
        ] as [number, number][],
      ],
      [
        12,
        [
          [31.6, 40.7],
          [32.8, 39.9],
        ] as [number, number][],
      ],
    ]);
    const detail = tripDetail(trips[1]!, routes, car, f, now, true);
    expect(detail.title).toBe("Ankara");
    expect(detail.steps.map((step) => [step.kind, step.target])).toEqual([
      ["drive", { kind: "drive", id: 11 }],
      ["charge", { kind: "charge", id: 77 }],
      ["drive", { kind: "drive", id: 12 }],
    ]);
    expect(detail.routes).toHaveLength(2);
    expect(detail.markers?.map((marker) => marker.kind)).toEqual([
      "start",
      "charge",
      "end",
    ]);
    expect(detail.markers?.[0]).toMatchObject({ longitude: 29, latitude: 41 });
    const hidden = tripDetail(trips[1]!, routes, car, f, now, false);
    expect(hidden.routes).toBeNull();
    expect(hidden.markers).toBeNull();
  });
});
