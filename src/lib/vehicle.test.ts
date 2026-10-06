import { describe, expect, test } from "bun:test";
import {
  activityLabel,
  batteryCaption,
  batteryTone,
  carActivity,
  liveActivity,
  colorName,
  driveEfficiency,
  modelName,
  placeLabel,
  tabDirection,
  tabFromPath,
  variantLine,
} from "./vehicle";

describe("car names", () => {
  test.each([
    ["Y", "Model Y"],
    ["3", "Model 3"],
    ["Z", "Model Z"],
    [null, "Tesla"],
  ])("modelName(%p)", (model, expected) => {
    expect(modelName(model)).toBe(expected);
  });

  test.each([
    ["StealthGrey", "Stealth Grey"],
    ["MidnightSilverMetallic", "Midnight Silver Metallic"],
    ["PPSW", "PPSW"],
    [null, null],
  ])("colorName(%p)", (code, expected) => {
    expect(colorName(code)).toBe(expected);
  });

  test("builds the variant line from the parts that exist", () => {
    expect(
      variantLine({
        model: "Y",
        marketingName: "SR",
        exteriorColor: "StealthGrey",
      }),
    ).toBe("Model Y SR · Stealth Grey");
    expect(
      variantLine({ model: null, marketingName: null, exteriorColor: null }),
    ).toBe("Tesla");
  });
});

describe("activity", () => {
  test("puts an open drive before an open charge and the recorded state", () => {
    expect(
      carActivity({ state: "online", driving: true, charging: true }),
    ).toBe("driving");
    expect(
      carActivity({ state: "online", driving: false, charging: true }),
    ).toBe("charging");
    expect(
      carActivity({ state: "asleep", driving: false, charging: false }),
    ).toBe("asleep");
    expect(carActivity({ state: null, driving: false, charging: false })).toBe(
      "unknown",
    );
  });

  test("labels each activity with a tone", () => {
    expect(activityLabel("charging")).toEqual({
      label: "Charging",
      tone: "charge",
    });
    expect(activityLabel("unknown")).toEqual({
      label: "No data yet",
      tone: "quiet",
    });
  });

  test.each([
    [57, false, "normal"],
    [20, false, "low"],
    [12, true, "charge"],
    [null, false, "normal"],
  ] as const)("batteryTone(%p, %p)", (level, charging, expected) => {
    expect(batteryTone(level, charging)).toBe(expected);
  });
});

describe("liveActivity", () => {
  test("maps the TeslaMate MQTT states", () => {
    expect(liveActivity("driving")).toBe("driving");
    expect(liveActivity("charging")).toBe("charging");
    expect(liveActivity("suspended")).toBe("online");
    expect(liveActivity("updating")).toBe("online");
    expect(liveActivity("asleep")).toBe("asleep");
  });

  test("gives nothing for an unknown or missing state", () => {
    expect(liveActivity("start")).toBeNull();
    expect(liveActivity(null)).toBeNull();
  });
});

describe("driveEfficiency", () => {
  const drive = {
    startRangeKm: 300,
    endRangeKm: 280,
    distanceKm: 18,
    carEfficiencyKwhPerKm: 0.15,
  };

  test("turns the rated range used into watt-hours per kilometre", () => {
    expect(driveEfficiency(drive)).toBeCloseTo(166.67, 2);
  });

  test("gives no value for short drives, gained range or missing data", () => {
    expect(driveEfficiency({ ...drive, distanceKm: 0.2 })).toBeNull();
    expect(driveEfficiency({ ...drive, endRangeKm: 305 })).toBeNull();
    expect(
      driveEfficiency({ ...drive, carEfficiencyKwhPerKm: null }),
    ).toBeNull();
  });
});

describe("tabs", () => {
  test("slides forward to a later tab and back to an earlier tab", () => {
    expect(tabDirection("overview", "charging")).toBe("tab-forward");
    expect(tabDirection("charging", "drives")).toBe("tab-back");
    expect(tabDirection("drives", "drives")).toBeNull();
  });

  test.each([
    ["/cars/2", "overview"],
    ["/cars/2/drives", "drives"],
    ["/cars/2/drives/41", "drives"],
    ["/cars/2/charging", "charging"],
    ["/cars/2/charging/7", "charging"],
    ["/cars/2/battery", "battery"],
    ["/cars/2/stats", "stats"],
    ["/cars/2/places", "places"],
    ["/cars/2/timeline", "overview"],
    ["/cars/2/drivesx", "overview"],
    ["/elsewhere", "overview"],
  ] as const)("tabFromPath(%p)", (path, expected) => {
    expect(tabFromPath(path, 2)).toBe(expected);
  });
});

describe("placeLabel", () => {
  const empty = {
    geofence: null,
    name: null,
    road: null,
    houseNumber: null,
    city: null,
  };

  test("prefers the geofence, then the place name, then the street", () => {
    expect(placeLabel({ ...empty, geofence: "Home", name: "Park" })).toBe(
      "Home",
    );
    expect(placeLabel({ ...empty, name: "Zorlu Center" })).toBe("Zorlu Center");
    expect(
      placeLabel({
        ...empty,
        road: "Bağdat Caddesi",
        houseNumber: "12",
        city: "İstanbul",
      }),
    ).toBe("Bağdat Caddesi 12, İstanbul");
    expect(placeLabel({ ...empty, city: "Kocaeli" })).toBe("Kocaeli");
    expect(placeLabel(empty)).toBe("Unknown place");
  });

  test("follows the place style", () => {
    const place = {
      geofence: "Home",
      name: null,
      road: "Kartal Sokak",
      houseNumber: "12",
      city: "İzmit",
    };
    expect(
      placeLabel(place, { placeNames: "address", addressDetail: "full" }),
    ).toBe("Kartal Sokak 12, İzmit");
    expect(
      placeLabel(place, { placeNames: "address", addressDetail: "street" }),
    ).toBe("Kartal Sokak");
    expect(
      placeLabel(place, { placeNames: "address", addressDetail: "city" }),
    ).toBe("İzmit");
    expect(
      placeLabel(place, { placeNames: "geofence", addressDetail: "city" }),
    ).toBe("Home");
  });
});

describe("batteryCaption", () => {
  test("names a charge first", () => {
    expect(batteryCaption({ level: 50, usableLevel: 40, charging: true })).toBe(
      "Charging",
    );
    expect(
      batteryCaption({
        level: 50,
        usableLevel: 50,
        charging: true,
        limitPercent: 100,
      }),
    ).toBe("Charging to 100%");
  });

  test("names a cold battery only for a gap of three points or more", () => {
    expect(
      batteryCaption({ level: 57, usableLevel: 56, charging: false }),
    ).toBe("Rated range");
    expect(
      batteryCaption({ level: 57, usableLevel: 54, charging: false }),
    ).toBe("54% usable, the battery is cold");
    expect(
      batteryCaption({ level: null, usableLevel: null, charging: false }),
    ).toBe("Rated range");
  });
});
