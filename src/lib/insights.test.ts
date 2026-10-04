import { describe, expect, test } from "bun:test";
import {
  buildTimeline,
  batteryCapacity,
  bucketUnit,
  dayWindow,
  drainRate,
  levelHistogram,
  levelShares,
  localDayKey,
  median,
  parseDayKey,
  periodStart,
  readPeriod,
  shiftDayKey,
  temperatureBands,
  timelineItems,
  weekGrid,
} from "./insights";

const istanbul = "Europe/Istanbul";
const at = (iso: string) => new Date(iso);

describe("days", () => {
  test("finds the local day and its UTC window", () => {
    expect(localDayKey(at("2026-09-30T21:30:00Z"), istanbul)).toBe(
      "2026-10-01",
    );
    const window = dayWindow("2026-10-01", istanbul);
    expect(window.start.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-10-01T21:00:00.000Z");
  });

  test("follows a daylight saving change", () => {
    const window = dayWindow("2026-03-29", "Europe/Berlin");
    expect(window.end.getTime() - window.start.getTime()).toBe(23 * 3_600_000);
  });

  test("reads only real dates and shifts across month ends", () => {
    expect(parseDayKey("2026-10-01")).toBe("2026-10-01");
    expect(parseDayKey("2026-02-30")).toBeNull();
    expect(parseDayKey("yesterday")).toBeNull();
    expect(parseDayKey(undefined)).toBeNull();
    expect(shiftDayKey("2026-10-01", -1)).toBe("2026-09-30");
    expect(shiftDayKey("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("buildTimeline", () => {
  const window = {
    start: at("2026-10-01T00:00:00Z"),
    end: at("2026-10-02T00:00:00Z"),
  };
  const drive = {
    id: 7,
    start: at("2026-10-01T08:00:00Z"),
    end: at("2026-10-01T08:40:00Z"),
    from: "Home",
    to: "Office",
    distanceKm: 52,
  };
  const charge = {
    id: 3,
    start: at("2026-10-01T18:30:00Z"),
    end: at("2026-10-01T22:00:00Z"),
    place: "Home",
    energyAddedKwh: 18,
    fast: false,
  };
  const states = [
    {
      state: "asleep" as const,
      start: at("2026-09-30T20:00:00Z"),
      end: at("2026-10-01T07:58:00Z"),
    },
    {
      state: "online" as const,
      start: at("2026-10-01T07:58:00Z"),
      end: at("2026-10-01T08:55:00Z"),
    },
    {
      state: "asleep" as const,
      start: at("2026-10-01T08:55:00Z"),
      end: at("2026-10-01T18:25:00Z"),
    },
    { state: "online" as const, start: at("2026-10-01T18:25:00Z"), end: null },
  ];

  test("lays drives and charges over the states and clips to the day", () => {
    const segments = buildTimeline({
      states,
      drives: [drive],
      charges: [charge],
      ...window,
      now: at("2026-10-01T23:00:00Z"),
    });
    expect(segments.map((segment) => segment.kind)).toEqual([
      "asleep",
      "online",
      "drive",
      "online",
      "asleep",
      "online",
      "charge",
      "online",
    ]);
    expect(segments[0].start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(segments.at(-1)?.end.toISOString()).toBe("2026-10-01T23:00:00.000Z");
    segments.slice(1).forEach((segment, index) => {
      expect(segment.start.getTime()).toBe(segments[index].end.getTime());
    });
  });

  test("joins the states between drives and charges into parked stops", () => {
    const items = timelineItems(
      buildTimeline({
        states,
        drives: [drive],
        charges: [charge],
        ...window,
        now: at("2026-10-01T23:00:00Z"),
      }),
    );
    expect(items.map((item) => item.kind)).toEqual([
      "parked",
      "drive",
      "parked",
      "charge",
      "parked",
    ]);
    const first = items[0];
    const middle = items[2];
    expect(first.kind === "parked" && first.place).toBe("Home");
    expect(middle.kind === "parked" && middle.place).toBe("Office");
    expect(first.kind === "parked" && first.asleepMs).toBe(
      (7 * 60 + 58) * 60_000,
    );
    expect(first.kind === "parked" && first.awakeMs).toBe(2 * 60_000);
  });

  test("gives an empty day when the window has not started", () => {
    expect(
      buildTimeline({
        states,
        drives: [],
        charges: [],
        ...window,
        now: at("2026-09-30T12:00:00Z"),
      }),
    ).toEqual([]);
  });
});

describe("battery", () => {
  test("finds the median", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  test("compares the recent charges with the best one for health", () => {
    const points = [60, 60.4, 59.8, 59.9, 59.2, 58.8, 58.9, 59].map(
      (kwh, index) => ({ at: new Date(2026, 0, index + 1), kwh }),
    );
    const capacity = batteryCapacity(points);
    expect(capacity?.bestKwh).toBe(60.4);
    expect(capacity?.nowKwh).toBe(59);
    expect(capacity?.healthPercent).toBeCloseTo(97.68, 2);
    expect(capacity?.missingCharges).toBe(0);
  });

  test("gives the capacity before there are enough charges for health", () => {
    const points = [61.5, 61.8].map((kwh, index) => ({
      at: new Date(2026, 9, index + 2),
      kwh,
    }));
    expect(batteryCapacity(points)).toEqual({
      nowKwh: 61.65,
      bestKwh: 61.8,
      healthPercent: null,
      missingCharges: 1,
    });
    expect(batteryCapacity([])).toBeNull();
    expect(batteryCapacity([{ at: new Date(0), kwh: 0 }])).toBeNull();
  });

  test("counts levels in buckets of ten points", () => {
    const buckets = levelHistogram([5, 19, 20, 80, 100, 100]);
    expect(buckets).toHaveLength(10);
    expect(buckets[0]).toEqual({ level: 0, count: 1 });
    expect(buckets[1]).toEqual({ level: 10, count: 1 });
    expect(buckets[2]).toEqual({ level: 20, count: 1 });
    expect(buckets[8]).toEqual({ level: 80, count: 1 });
    expect(buckets[9]).toEqual({ level: 90, count: 2 });
  });

  test("averages the idle loss over all parked time", () => {
    const period = (hours: number, rangeLostKm: number | null) => ({
      start: new Date(0),
      end: new Date(hours * 3_600_000),
      durationS: hours * 3600,
      standby: 0.75,
      levelLost: 1,
      rangeLostKm,
      energyKwh: rangeLostKm === null ? null : rangeLostKm * 0.15,
    });
    const rate = drainRate([period(12, 3), period(12, 1), period(6, null)]);
    expect(rate?.kmPerDay).toBeCloseTo(4, 5);
    expect(rate?.levelPerDay).toBeCloseTo(2, 5);
    expect(rate?.watts).toBeCloseTo(25, 5);
    expect(rate?.standby).toBeCloseTo(0.75, 5);
    expect(drainRate([period(6, null)])).toBeNull();
  });

  test("shares time between the charge level bands", () => {
    const shares = levelShares([
      { level: 15, weightMs: 1 },
      { level: 60, weightMs: 6 },
      { level: 85, weightMs: 2 },
      { level: 100, weightMs: 1 },
    ]);
    expect(shares.map((band) => [band.id, band.share])).toEqual([
      ["low", 0.1],
      ["mid", 0],
      ["good", 0.6],
      ["high", 0.2],
      ["full", 0.1],
    ]);
    expect(levelShares([]).every((band) => band.share === 0)).toBe(true);
  });
});

describe("periods", () => {
  test("reads a known period and falls back to 30 days", () => {
    expect(readPeriod("7d")).toBe("7d");
    expect(readPeriod("forever")).toBe("30d");
    expect(readPeriod(undefined)).toBe("30d");
  });

  test("starts a period the right number of days ago", () => {
    const now = at("2026-10-01T12:00:00Z");
    expect(periodStart("7d", now)?.toISOString()).toBe(
      "2026-09-24T12:00:00.000Z",
    );
    expect(periodStart("all", now)).toBeNull();
  });
});

describe("stats", () => {
  test("picks a bucket size for each period", () => {
    expect(bucketUnit("7d")).toBe("day");
    expect(bucketUnit("30d")).toBe("day");
    expect(bucketUnit("90d")).toBe("week");
    expect(bucketUnit("1y")).toBe("month");
    expect(bucketUnit("all")).toBe("month");
  });

  test("weights efficiency by distance in each temperature band", () => {
    const bands = temperatureBands([
      { temperature: 21, distanceKm: 10, usedKwh: 1.5 },
      { temperature: 23, distanceKm: 30, usedKwh: 4.5 },
      { temperature: -3, distanceKm: 20, usedKwh: 4 },
      { temperature: 8, distanceKm: 0, usedKwh: 1 },
    ]);
    expect(bands).toEqual([
      { from: -5, to: 0, whPerKm: 200, distanceKm: 20, drives: 1 },
      { from: 20, to: 25, whPerKm: 150, distanceKm: 40, drives: 2 },
    ]);
  });

  test("places drive starts on a Monday-first week grid", () => {
    const grid = weekGrid([
      { weekday: 1, hour: 8, drives: 3 },
      { weekday: 7, hour: 23, drives: 1 },
      { weekday: 9, hour: 2, drives: 5 },
    ]);
    expect(grid).toHaveLength(7);
    expect(grid[0][8]).toBe(3);
    expect(grid[6][23]).toBe(1);
    expect(grid.flat().reduce((sum, value) => sum + value, 0)).toBe(4);
  });
});
