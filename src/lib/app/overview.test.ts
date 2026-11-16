import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { dayWindow } from "../insights";
import { liveView } from "../live/view";
import { defaultPreferences } from "../preferences";
import type { Car, CarSnapshot, Charge, Drive } from "../queries";
import type { OverviewPage } from "./contract";
import { dayStrip, overviewPage, type OverviewInput } from "./overview";

const f = createFormatter(defaultPreferences, "Europe/Istanbul");
const now = new Date("2026-10-17T15:00:00Z");

const car: Car = {
  id: 2,
  name: "Rika",
  slug: "rika",
  model: "Y",
  marketingName: "SR",
  exteriorColor: "StealthGrey",
  wheelType: null,
  trimBadging: null,
  efficiencyKwhPerKm: 0.136,
  lfpBattery: false,
  modelYear: null,
};

const snapshot: CarSnapshot = {
  positionAt: new Date("2026-10-17T14:55:00Z"),
  latitude: 33.42,
  longitude: -111.94,
  batteryAt: null,
  batteryLevel: 62,
  usableBatteryLevel: 62,
  rangeKm: 271.4,
  odometerKm: 4286.7,
  outsideTemp: 18,
  insideTemp: 21,
  climateOn: false,
  tires: { frontLeft: 2.9, frontRight: 2.9, rearLeft: 2.5, rearRight: 2.9 },
  state: "online",
  stateSince: null,
  driving: false,
  charging: false,
  softwareVersion: "2026.20.300",
};

const imageFrame = { left: 0.227, top: 0.275, width: 0.558, height: 0.422 };

const input: OverviewInput = {
  car,
  image: "https://example.com/car.png",
  imageFrame,
  snapshot,
  lastDrive: null,
  lastCharge: null,
  today: null,
  live: null,
  leaks: [{ tire: "rearLeft", dropBar: 0.3, days: 5 }],
  history: null,
  show: defaultPreferences.overview,
  showMaps: true,
  capacity: [],
  driven: {
    drives: 0,
    distanceKm: 0,
    minutes: 0,
    usedKwh: 0,
    speedMaxKmh: null,
    longestKm: null,
  },
  period: "30d",
};

const lastDrive: Drive = {
  id: 7,
  startAt: new Date("2026-10-17T13:00:00Z"),
  endAt: new Date("2026-10-17T13:25:00Z"),
  from: "Home",
  to: "Office",
  distanceKm: 18.2,
  durationMin: 25,
  efficiencyWhPerKm: 150,
  speedMaxKmh: 90,
  powerMaxKw: 120,
  powerMinKw: -40,
  ascentM: null,
  descentM: null,
  outsideTempAvg: 18,
  startLevel: 66,
  endLevel: 62,
  leftOpen: false,
};

const lastCharge: Charge = {
  id: 9,
  startAt: new Date("2026-10-16T19:00:00Z"),
  endAt: new Date("2026-10-16T22:00:00Z"),
  place: "Home",
  energyAddedKwh: 24.6,
  startLevel: 30,
  endLevel: 66,
  durationMin: 180,
  maxPowerKw: 11,
  fastCharger: false,
  cost: null,
  costEstimated: false,
  latitude: null,
  longitude: null,
};

function liveInput(values: Record<string, string>): OverviewInput {
  return {
    ...input,
    live: {
      connected: true,
      hasValues: true,
      view: liveView(values, {}, now.getTime()),
    },
  };
}

function menuSubtitle(page: OverviewPage, key: string): string | null {
  return page.menu.find((row) => row.key === key)?.subtitle ?? null;
}

function repeatedValues(page: OverviewPage): string[] {
  const parts = [
    page.activity.label,
    ...page.callouts.map((callout) => callout.value),
    ...page.menu.map((row) => row.subtitle),
  ].flatMap((text) => text?.split(" · ") ?? []);
  return parts.filter((part, index) => parts.indexOf(part) !== index);
}

describe("overviewPage", () => {
  test("lists the lock and Sentry Mode changes with an unlock as a warning", () => {
    const at = now.getTime() - 60_000;
    const page = overviewPage(
      {
        ...input,
        history: [
          { kind: "locked", value: false, at },
          { kind: "sentry", value: true, at: at - 1000 },
        ],
      },
      f,
      now,
    );
    expect(page.history).toMatchObject([
      { icon: "lock-open", title: "Unlocked", tone: "warning" },
      { icon: "shield", title: "Sentry Mode on", tone: "normal" },
    ]);
    expect(page.history?.[0]?.when).toContain(f.clock(new Date(at)));
    expect(overviewPage(input, f, now).history).toBeNull();
  });

  test("formats the battery, the stats, and the tires", () => {
    const page = overviewPage(input, f, now);
    expect(page.car).toEqual({
      id: 2,
      name: "Rika",
      variant: "Model Y SR · Stealth Grey",
      image: "https://example.com/car.png",
      imageFrame,
    });
    expect(page.activity).toEqual({
      label: "Online",
      tone: "active",
      updated: "Updated 5 min ago",
    });
    expect(page.battery).toMatchObject({
      level: 62,
      range: "271 km",
      caption: "Rated range",
      tone: "normal",
    });
    expect(page.stats.map((stat) => stat.value.text)).toEqual([
      "4,287 km",
      "18 °C",
      "21 °C",
      "2026.20.300",
    ]);
    expect(page.stats.find((stat) => stat.label === "Cabin")?.detail).toBe(
      "Climate off",
    );
    expect(page.stats.find((stat) => stat.label === "Outside")?.detail).toBe(
      null,
    );
    expect(page).not.toHaveProperty("lastDrive");
    expect(page).not.toHaveProperty("lastCharge");
    expect(page.tires?.rearLeft.tone).toBe("bad");
    expect(page.tires?.rearLeft.note).toContain("slow leak");
    expect(page.tires?.warnings[0]).toContain("Rear left tire");
    expect(page.location?.lastSeen).toBe("Last seen today at 17:55");
  });

  test("gives a tire with a slow leak the warning tone", () => {
    const page = overviewPage(
      {
        ...input,
        snapshot: {
          ...snapshot,
          tires: {
            frontLeft: 2.9,
            frontRight: 2.9,
            rearLeft: 2.8,
            rearRight: 2.9,
          },
        },
        leaks: [{ tire: "rearLeft", dropBar: 0.1, days: 13 }],
      },
      f,
      now,
    );
    expect(page.tires?.rearLeft.text).toBe("2.8 bar");
    expect(page.tires?.rearLeft.tone).toBe("warning");
    expect(page.tires?.rearLeft.note).toContain("Possible slow leak");
    expect(page.tires?.rearLeft.note).toContain(
      "down 0.1 bar against the other tires in 13 days",
    );
    expect(page.tires?.frontLeft.tone).toBe("good");
    expect(page.tires?.warnings).toHaveLength(1);
  });

  test("draws the callouts and the menu from the snapshot", () => {
    const page = overviewPage(input, f, now);
    expect(page.callouts).toEqual([
      {
        key: "battery",
        side: "left",
        label: "Battery",
        value: "62% · 271 km",
        tone: "normal",
      },
      {
        key: "odometer",
        side: "right",
        label: "Odometer",
        value: "4,287 km",
        tone: "normal",
      },
    ]);
    expect(page.menu.map((row) => row.key)).toEqual([
      "drives",
      "charging",
      "battery",
      "stats",
      "places",
      "location",
      "settings",
    ]);
    expect(page.menu.map((row) => row.subtitle)).toEqual([
      "No drive yet",
      "No charge yet",
      "No long charge yet",
      "Last 30 days · No drive",
      "Visited and charging places",
      "Map and Open in Maps",
      null,
    ]);
  });

  test("gives the health, the capacity, and the totals of the period", () => {
    const page = overviewPage(
      {
        ...input,
        capacity: [
          { at: new Date("2026-08-01T00:00:00Z"), kwh: 60 },
          { at: new Date("2026-09-01T00:00:00Z"), kwh: 59.5 },
          { at: new Date("2026-10-01T00:00:00Z"), kwh: 59 },
        ],
        driven: {
          drives: 41,
          distanceKm: 1760.4,
          minutes: 1900,
          usedKwh: 257,
          speedMaxKmh: 130,
          longestKm: 210,
        },
      },
      f,
      now,
    );
    expect(menuSubtitle(page, "battery")).toBe(
      "Health 99.2% · Capacity 59.5 kWh",
    );
    expect(menuSubtitle(page, "stats")).toBe(
      "Last 30 days · 1,760 km · 146 Wh/km",
    );
  });

  test("names a cold battery first in the Battery row", () => {
    const page = overviewPage(
      { ...input, snapshot: { ...snapshot, usableBatteryLevel: 58 } },
      f,
      now,
    );
    expect(menuSubtitle(page, "battery")).toBe(
      "58% usable, the battery is cold",
    );
  });

  test("warns about a low battery in the left callout", () => {
    const page = overviewPage(
      { ...input, snapshot: { ...snapshot, batteryLevel: 15 } },
      f,
      now,
    );
    expect(page.callouts[0]).toMatchObject({
      key: "battery",
      value: "15% · 271 km",
      tone: "warning",
    });
  });

  test("shows the power and the limit of a charge in the right callout", () => {
    const page = overviewPage(
      liveInput({
        charging_state: "Charging",
        plugged_in: "true",
        charger_power: "7.4",
        charge_limit_soc: "80",
      }),
      f,
      now,
    );
    expect(page.callouts.at(-1)).toEqual({
      key: "charging",
      side: "right",
      label: "Charging",
      value: "7.4 kW · to 80%",
      tone: "charge",
    });
    expect(page.callouts[0]?.tone).toBe("charge");
  });

  test("shows each value once", () => {
    const pages = [
      overviewPage(input, f, now),
      overviewPage(
        {
          ...liveInput({
            state: "online",
            locked: "true",
            sentry_mode: "true",
            plugged_in: "true",
            charging_state: "Complete",
            charge_limit_soc: "80",
            doors_open: "false",
            is_climate_on: "false",
            version: "2026.20.300",
          }),
          lastDrive,
          lastCharge,
        },
        f,
        now,
      ),
      overviewPage(
        {
          ...liveInput({
            state: "driving",
            shift_state: "D",
            locked: "true",
            is_climate_on: "true",
          }),
          lastDrive,
          lastCharge,
        },
        f,
        now,
      ),
    ];
    for (const page of pages) expect(repeatedValues(page)).toEqual([]);
    expect(menuSubtitle(pages[1] as OverviewPage, "status")).toBe(
      "All closed · Climate off · Up to date",
    );
    expect(menuSubtitle(pages[2] as OverviewPage, "status")).toBe("Climate on");
  });

  test("shows the live tiles with the end of the charge as a time", () => {
    const view = liveView(
      {
        locked: "true",
        charging_state: "Charging",
        plugged_in: "true",
        time_to_full_charge: "2",
      },
      {},
      now.getTime(),
    );
    const page = overviewPage(
      { ...input, live: { connected: true, hasValues: true, view } },
      f,
      now,
    );
    const charging = page.live?.tiles.find((tile) => tile.key === "charging");
    expect(charging?.fullAt).toBe("2026-10-17T17:00:00.000Z");
    expect(
      page.callouts.map((callout) => [callout.key, callout.value]),
    ).toEqual([
      ["battery", "62% · 271 km"],
      ["lock", "Locked"],
      ["plug", "Plugged in"],
    ]);
    expect(menuSubtitle(page, "status")).toBeNull();
    expect(menuSubtitle(page, "charging")).toBe("No charge yet");
    expect(page.battery?.caption).toBe("Charging");
    expect(page.battery?.fullAt).toBe("2026-10-17T17:00:00.000Z");
  });

  test("leaves out a car figure without a value", () => {
    const page = overviewPage(
      {
        ...input,
        snapshot: {
          ...snapshot,
          outsideTemp: null,
          softwareVersion: null,
        },
      },
      f,
      now,
    );
    expect(page.stats.map((stat) => stat.label)).toEqual(["Odometer", "Cabin"]);
  });

  test("shows the last drive and charge in the menu only with the switch on", () => {
    const records = { ...input, lastDrive, lastCharge };
    const shown = overviewPage(records, f, now);
    expect(menuSubtitle(shown, "drives")).toStartWith("Home → Office · ");
    expect(menuSubtitle(shown, "charging")).toStartWith(
      "Home · +24.6 kWh · 30% → 66% · ",
    );
    const hidden = overviewPage(
      {
        ...records,
        show: { ...defaultPreferences.overview, recent: false },
      },
      f,
      now,
    );
    expect(menuSubtitle(hidden, "drives")).toBeNull();
    expect(menuSubtitle(hidden, "charging")).toBeNull();
    expect(menuSubtitle(hidden, "battery")).toBe("No long charge yet");
  });

  test("hides the cards that Settings turns off, and maps when hidden", () => {
    const page = overviewPage(
      {
        ...input,
        show: { ...defaultPreferences.overview, tires: false, render: false },
        showMaps: false,
      },
      f,
      now,
    );
    expect(page.tires).toBeNull();
    expect(page.car.image).toBeNull();
    expect(page.car.imageFrame).toBeNull();
    expect(page.location).toBeNull();
  });

  test("names the place of a parked car from the last drive", () => {
    const page = overviewPage({ ...input, lastDrive, lastCharge }, f, now);
    expect(page.location).toMatchObject({
      place: "Office",
      since: "Parked since today at 16:25 · 1 h 35 min",
      lastSeen: "Last seen today at 17:55",
    });
    expect(menuSubtitle(page, "location")).toBe("Office");
  });

  test("gives no place while the car drives", () => {
    const pages = [
      overviewPage(
        {
          ...input,
          snapshot: { ...snapshot, driving: true },
          lastDrive,
          lastCharge,
        },
        f,
        now,
      ),
      overviewPage(
        { ...liveInput({ state: "driving" }), lastDrive, lastCharge },
        f,
        now,
      ),
    ];
    for (const page of pages) {
      expect(page.location).toMatchObject({ place: null, since: null });
      expect(menuSubtitle(page, "location")).toBe("Map and Open in Maps");
    }
  });

  test("falls back to the last charge and leaves out an unknown place", () => {
    const charged = overviewPage({ ...input, lastCharge }, f, now);
    expect(charged.location).toMatchObject({ place: "Home", since: null });
    const unknown = overviewPage(
      { ...input, lastDrive: { ...lastDrive, to: "Unknown place" } },
      f,
      now,
    );
    expect(unknown.location?.place).toBeNull();
    expect(unknown.location?.since).toStartWith("Parked since today at 16:25");
    expect(menuSubtitle(unknown, "location")).toBe("Map and Open in Maps");
  });

  test("keeps the place out of the menu when maps are off", () => {
    const page = overviewPage({ ...input, lastDrive, showMaps: false }, f, now);
    expect(page.location).toBeNull();
    expect(menuSubtitle(page, "location")).toBe("Map and Open in Maps");
  });

  test("explains a car without records", () => {
    const page = overviewPage(
      {
        ...input,
        snapshot: { ...snapshot, batteryLevel: null, positionAt: null },
      },
      f,
      now,
    );
    expect(page.empty).toContain("TeslaMate fills this page");
    expect(page.battery).toBeNull();
    expect(page.stats).toEqual([]);
    expect(page.callouts).toEqual([]);
    expect(menuSubtitle(page, "battery")).toBe("No long charge yet");
    expect(menuSubtitle(page, "stats")).toBe("Last 30 days · No drive");
  });
});

describe("dayStrip", () => {
  test("gives the key of the strip with Now inside today", () => {
    const strip = dayStrip(
      {
        ...dayWindow("2026-10-17", f.timeZone),
        states: [],
        drives: [],
        charges: [],
      },
      f,
      now,
    );
    expect(strip.legend?.map((entry) => entry.label)).toEqual([
      "Driving",
      "Charging",
      "Awake",
      "Asleep",
      "Offline",
      "Now",
    ]);
  });
});
