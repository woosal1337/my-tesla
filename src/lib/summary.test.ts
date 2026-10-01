import { describe, expect, test } from "bun:test";
import { liveView } from "./live/view";
import type { Car, CarSnapshot } from "./queries";
import { carSummary, wantsLocation, type SummaryInput } from "./summary";

const car: Car = {
  id: 1,
  name: "Nova",
  model: "Y",
  marketingName: "Long Range",
  exteriorColor: "StealthGrey",
  wheelType: null,
  trimBadging: null,
  efficiencyKwhPerKm: 0.152,
};

const snapshot: CarSnapshot = {
  positionAt: new Date(Date.UTC(2026, 9, 1, 18, 5)),
  latitude: 33.4484,
  longitude: -112.074,
  batteryAt: new Date(Date.UTC(2026, 9, 1, 18, 4)),
  batteryLevel: 78,
  usableBatteryLevel: 77,
  rangeKm: 401.23456,
  odometerKm: 18234.567,
  outsideTemp: 31.5,
  insideTemp: 24,
  climateOn: false,
  tires: { frontLeft: 2.9, frontRight: 2.875, rearLeft: 2.725, rearRight: 2.9 },
  state: "asleep",
  stateSince: new Date(Date.UTC(2026, 9, 1, 17, 30)),
  driving: false,
  charging: false,
  softwareVersion: "2026.20.300",
};

const base: SummaryInput = {
  car,
  snapshot,
  live: null,
  rangeKind: "rated",
  includeLocation: false,
  now: new Date(Date.UTC(2026, 9, 1, 18, 10)),
};

const driving = liveView({
  state: "driving",
  locked: "true",
  sentry_mode: "false",
  is_user_present: "true",
  doors_open: "false",
  shift_state: "D",
  speed: "88",
  power: "21",
  charging_state: "Disconnected",
  plugged_in: "false",
  inside_temp: "21.5",
  tpms_pressure_fl: "2.912",
  tpms_pressure_fr: "2.9",
  tpms_pressure_rl: "2.7",
  tpms_pressure_rr: "2.9",
  active_route:
    '{"destination":"Saguaro Lake","miles_to_arrival":12.4,"minutes_to_arrival":18,"energy_at_arrival":71,"traffic_minutes_delay":0}',
});

describe("carSummary", () => {
  test("reports the recorded state in metric units", () => {
    const summary = carSummary(base);
    expect(summary.car).toEqual({
      id: 1,
      name: "Nova",
      model: "Model Y",
      trim: "Long Range",
    });
    expect(summary.state).toBe("asleep");
    expect(summary.updatedAt).toBe("2026-10-01T18:05:00.000Z");
    expect(summary.battery).toEqual({
      levelPercent: 78,
      usableLevelPercent: 77,
      rangeKm: 401.2,
      rangeKind: "rated",
      at: "2026-10-01T18:04:00.000Z",
    });
    expect(summary.odometerKm).toBe(18234.6);
    expect(summary.tiresBar?.frontRight).toBe(2.88);
    expect(summary.live).toBeNull();
    expect(summary.generatedAt).toBe("2026-10-01T18:10:00.000Z");
  });

  test("leaves the location out unless the caller asks for it", () => {
    const summary = carSummary({
      ...base,
      live: { connected: true, hasValues: true, view: driving },
    });
    expect(summary).not.toHaveProperty("location");
    expect(JSON.stringify(summary)).not.toContain("Saguaro");
    expect(JSON.stringify(summary)).not.toContain("33.4484");
  });

  test("gives the position and the navigation when asked", () => {
    const summary = carSummary({
      ...base,
      includeLocation: true,
      live: { connected: true, hasValues: true, view: driving },
    });
    expect(summary.location).toEqual({
      latitude: 33.4484,
      longitude: -112.074,
      at: "2026-10-01T18:05:00.000Z",
      navigation: {
        destination: "Saguaro Lake",
        distanceKm: 20,
        minutesToArrival: 18,
        batteryAtArrivalPercent: 71,
      },
    });
  });

  test("prefers the live state and adds the live values", () => {
    const summary = carSummary({
      ...base,
      live: { connected: true, hasValues: true, view: driving },
    });
    expect(summary.state).toBe("driving");
    expect(summary.live).toMatchObject({
      connected: true,
      locked: true,
      openParts: [],
      driving: { gear: "D", speedKmh: 88, powerKw: 21 },
      climate: { insideTempC: 21.5 },
      tiresBar: { frontLeft: 2.91, rearLeft: 2.7 },
    });
  });

  test("marks a lost feed and keeps the recorded state", () => {
    const summary = carSummary({
      ...base,
      live: { connected: false, hasValues: true, view: driving },
    });
    expect(summary.state).toBe("asleep");
    expect(summary.live).toEqual({ connected: false });
  });
});

describe("wantsLocation", () => {
  test.each([
    ["1", true],
    ["true", true],
    ["0", false],
    ["yes", false],
    [null, false],
  ])("wantsLocation(%p)", (value, expected) => {
    expect(wantsLocation(value)).toBe(expected);
  });
});
