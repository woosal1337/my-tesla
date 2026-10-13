import { describe, expect, test } from "bun:test";
import type { Charge, Drive } from "./queries";
import {
  buildTrips,
  stopsText,
  tripDestination,
  tripItems,
  tripPresets,
  tripRange,
  tripSteps,
  tripSummary,
  tripTotals,
} from "./trip";
import type { TripLegRow } from "./trip-legs-sql";

const zone = "America/Phoenix";
const now = new Date(Date.UTC(2026, 9, 2, 3, 0));

function drive(
  id: number,
  hour: number,
  distanceKm: number | null,
  efficiency: number | null,
): Drive {
  return {
    id,
    startAt: new Date(Date.UTC(2026, 8, 20, hour)),
    endAt: new Date(Date.UTC(2026, 8, 20, hour, 30)),
    from: "A",
    to: "B",
    distanceKm,
    durationMin: 30,
    efficiencyWhPerKm: efficiency,
    speedMaxKmh: 80,
    powerMaxKw: 50,
    powerMinKw: -20,
    ascentM: 10,
    descentM: 10,
    outsideTempAvg: 25,
    startLevel: 80,
    endLevel: 70,
    leftOpen: false,
  };
}

function charge(id: number, hour: number, cost: number | null): Charge {
  return {
    id,
    startAt: new Date(Date.UTC(2026, 8, 20, hour)),
    endAt: new Date(Date.UTC(2026, 8, 20, hour + 1)),
    place: "Home",
    energyAddedKwh: 20,
    startLevel: 40,
    endLevel: 80,
    durationMin: 60,
    cost,
    costEstimated: false,
    maxPowerKw: 11,
    fastCharger: false,
    latitude: null,
    longitude: null,
  };
}

describe("tripRange", () => {
  test("defaults to the last seven local days", () => {
    const range = tripRange(null, null, zone, now);
    if (range === "invalid") throw new Error("range");
    expect(range.from).toBe("2026-09-25");
    expect(range.to).toBe("2026-10-01");
    expect(range.start.toISOString()).toBe("2026-09-25T07:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-02T07:00:00.000Z");
  });

  test.each([
    ["2026-10-02", "2026-10-01"],
    ["2025-01-01", "2026-10-01"],
    ["2026-1-1", "2026-10-01"],
  ])("refuses %s to %s", (from, to) => {
    expect(tripRange(from, to, zone, now)).toBe("invalid");
  });
});

describe("tripPresets", () => {
  test("gives four ranges that end today", () => {
    expect(tripPresets(now, zone)).toEqual([
      { label: "Last 7 days", from: "2026-09-25", to: "2026-10-01" },
      { label: "Last 30 days", from: "2026-09-02", to: "2026-10-01" },
      { label: "This month", from: "2026-10-01", to: "2026-10-01" },
      { label: "This year", from: "2026-01-01", to: "2026-10-01" },
    ]);
  });
});

describe("tripTotals", () => {
  test("adds the drives and the charges", () => {
    const totals = tripTotals(
      [drive(1, 10, 100, 150), drive(2, 14, 50, null)],
      [charge(1, 12, 5), charge(2, 20, null)],
    );
    expect(totals).toMatchObject({
      drives: 2,
      charges: 2,
      distanceKm: 150,
      drivingMin: 60,
      chargingMin: 120,
      energyAddedKwh: 40,
      cost: 5,
    });
    expect(totals.energyUsedKwh).toBeCloseTo(15, 6);
    expect(totals.consumptionWhPerKm).toBeCloseTo(150, 6);
  });

  test("gives no cost and no consumption without data", () => {
    const totals = tripTotals(
      [drive(1, 10, null, null)],
      [charge(1, 12, null)],
    );
    expect(totals.cost).toBeNull();
    expect(totals.consumptionWhPerKm).toBeNull();
  });
});

function at(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 8, 20, hour, minute));
}

function leg(
  id: number,
  start: Date,
  end: Date,
  from: string,
  to: string,
  levels: [start: number, end: number],
): Drive {
  return {
    ...drive(id, 0, 100, 150),
    startAt: start,
    endAt: end,
    durationMin: (end.getTime() - start.getTime()) / 60_000,
    from,
    to,
    startLevel: levels[0],
    endLevel: levels[1],
  };
}

function chargeAt(id: number, start: Date, place: string): Charge {
  return { ...charge(id, 0, 12), startAt: start, place };
}

const roadLegs: TripLegRow[] = [
  { driveId: 101, tripId: 101, chargedBefore: false },
  { driveId: 102, tripId: 101, chargedBefore: false },
  { driveId: 103, tripId: 101, chargedBefore: true },
  { driveId: 104, tripId: 104, chargedBefore: false },
];

const roadDrives = [
  leg(104, at(18), at(18, 30), "Ankara", "Hotel", [60, 55]),
  leg(103, at(10), at(11, 20), "Bolu Rest Area", "Ankara", [75, 60]),
  leg(102, at(7, 50), at(8, 50), "Bolu Rest Area", "Bolu Rest Area", [60, 30]),
  leg(101, at(6), at(7, 30), "Istanbul", "Bolu Rest Area", [90, 60]),
];

const onTheWay = chargeAt(1, at(9), "Supercharger Bolu");
const atTheHotel = chargeAt(2, at(22), "Hotel");

function roadTrips() {
  return buildTrips(roadLegs, roadDrives, [atTheHotel, onTheWay]);
}

describe("buildTrips", () => {
  test("joins the legs of one trip in time order", () => {
    const [road, evening] = roadTrips();
    expect(road.id).toBe(101);
    expect(road.drives.map((item) => item.id)).toEqual([101, 102, 103]);
    expect([road.from, road.to]).toEqual(["Istanbul", "Ankara"]);
    expect(road.startAt).toEqual(at(6));
    expect(road.endAt).toEqual(at(11, 20));
    expect(evening.drives.map((item) => item.id)).toEqual([104]);
    expect(evening.stops).toEqual([]);
  });

  test("puts a stop between two legs, with the charge that started in it", () => {
    const [road] = roadTrips();
    expect(road.stops).toEqual([
      {
        startAt: at(7, 30),
        endAt: at(7, 50),
        durationMin: 20,
        place: "Bolu Rest Area",
        charged: false,
        charges: [],
      },
      {
        startAt: at(8, 50),
        endAt: at(10),
        durationMin: 70,
        place: "Supercharger Bolu",
        charged: true,
        charges: [onTheWay],
      },
    ]);
  });

  test("keeps a charging stop when the charge record is absent", () => {
    const [road] = buildTrips(roadLegs, roadDrives, []);
    expect(road.stops[1]).toMatchObject({
      place: "Bolu Rest Area",
      charged: true,
      charges: [],
    });
  });

  test("leaves out a leg without a drive record", () => {
    const [road] = buildTrips(roadLegs, roadDrives.slice(1), []);
    expect(road.drives.map((item) => item.id)).toEqual([101, 102, 103]);
    expect(buildTrips(roadLegs, [], [])).toEqual([]);
  });
});

describe("tripSummary", () => {
  test("splits the time into driving and stops", () => {
    const [road] = roadTrips();
    const summary = tripSummary(road);
    expect(summary).toMatchObject({
      drives: 3,
      charges: 1,
      distanceKm: 300,
      drivingMin: 230,
      totalMin: 320,
      stoppedMin: 90,
      stops: 2,
      chargingStops: 1,
      energyAddedKwh: 20,
      cost: 12,
      speedMaxKmh: 80,
      startLevel: 90,
      endLevel: 60,
    });
    expect(summary.movingSpeedKmh).toBeCloseTo(78.26, 2);
  });

  test("gives no speed without driving time", () => {
    const [still] = buildTrips(
      [{ driveId: 1, tripId: 1, chargedBefore: false }],
      [{ ...leg(1, at(6), at(6), "A", "A", [50, 50]), speedMaxKmh: null }],
      [],
    );
    const summary = tripSummary(still);
    expect(summary.movingSpeedKmh).toBeNull();
    expect(summary.speedMaxKmh).toBeNull();
  });
});

describe("stopsText", () => {
  test.each([
    [0, 0, null],
    [1, 0, "1 stop"],
    [3, 0, "3 stops"],
    [3, 1, "3 stops, 1 with a charge"],
  ])("%i stops, %i with a charge", (stops, chargingStops, text) => {
    expect(stopsText({ stops, chargingStops })).toBe(text);
  });
});

describe("tripDestination", () => {
  test("is the end of a one-way trip", () => {
    const [road, evening] = roadTrips();
    expect(tripDestination(road)).toEqual({
      place: "Ankara",
      roundTrip: false,
    });
    expect(tripDestination(evening)).toEqual({
      place: "Hotel",
      roundTrip: false,
    });
  });

  test("is the longest stop of a round trip", () => {
    const [errands] = buildTrips(
      [
        { driveId: 1, tripId: 1, chargedBefore: false },
        { driveId: 2, tripId: 1, chargedBefore: false },
        { driveId: 3, tripId: 1, chargedBefore: false },
      ],
      [
        leg(1, at(9), at(9, 10), "Home", "Bakery", [80, 79]),
        leg(2, at(9, 15), at(9, 30), "Bakery", "Market", [79, 78]),
        leg(3, at(9, 55), at(10, 10), "Market", "Home", [78, 76]),
      ],
      [],
    );
    expect(tripDestination(errands)).toEqual({
      place: "Market",
      roundTrip: true,
    });
  });

  test("keeps the end of a loop without a stop", () => {
    const [loop] = buildTrips(
      [{ driveId: 1, tripId: 1, chargedBefore: false }],
      [leg(1, at(9), at(9, 40), "Home", "Home", [80, 75])],
      [],
    );
    expect(tripDestination(loop)).toEqual({ place: "Home", roundTrip: false });
  });
});

describe("tripSteps", () => {
  test("puts each stop after the leg before it", () => {
    const [road] = roadTrips();
    expect(
      tripSteps(road).map((step) =>
        step.kind === "drive" ? step.drive.id : step.stop.place,
      ),
    ).toEqual([101, "Bolu Rest Area", 102, "Supercharger Bolu", 103]);
  });
});

describe("tripItems", () => {
  test("lists the trips and the charges outside a trip, newest first", () => {
    const items = tripItems(roadTrips(), [atTheHotel, onTheWay]);
    expect(
      items.map(
        (item) =>
          `${item.kind}-${item.kind === "trip" ? item.trip.id : item.charge.id}`,
      ),
    ).toEqual(["charge-2", "trip-104", "trip-101"]);
  });
});
