import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { liveView } from "../live/view";
import { defaultPreferences } from "../preferences";
import type { Car, CarSnapshot } from "../queries";
import { overviewPage, type OverviewInput } from "./overview";

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
};

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
    expect(page.tires?.rearLeft.tone).toBe("bad");
    expect(page.tires?.warnings[0]).toContain("Rear left tire");
    expect(page.location?.lastSeen).toBe("Last seen today at 17:55");
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
        key: "seen",
        side: "top",
        label: "Last seen",
        value: "5 min ago",
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
    expect(page.menu[0]?.subtitle).toBe("No drive yet");
    expect(page.menu[2]?.subtitle).toBe("62% · 271 km · Rated range");
    expect(page.menu[5]?.subtitle).toBe("Last seen today at 17:55");
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
      ["charging", "Charging"],
    ]);
    expect(page.menu.find((row) => row.key === "status")?.subtitle).toContain(
      "Locked",
    );
    expect(page.menu.find((row) => row.key === "charging")?.subtitle).toBe(
      "Charging now",
    );
    expect(page.battery?.caption).toBe("Charging");
    expect(page.battery?.fullAt).toBe("2026-10-17T17:00:00.000Z");
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
  });
});
