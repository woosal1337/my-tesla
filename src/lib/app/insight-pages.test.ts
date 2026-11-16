import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import type { Car } from "../queries";
import type { AppBlock, InsightPage } from "./contract";
import { placesPage, type PlacesInput } from "./places";
import { statsPage, type StatsInput } from "./stats";

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

const emptyStats: StatsInput = {
  buckets: [],
  drives: {
    drives: 0,
    distanceKm: 0,
    minutes: 0,
    usedKwh: 0,
    speedMaxKmh: null,
    longestKm: null,
  },
  charges: { sessions: 0, addedKwh: 0, cost: null, estimatedCosts: 0 },
  efficiency: [],
  starts: [],
  pressure: [],
  updates: [],
  longest: [],
  speedRows: [],
  leaks: [],
  odometer: [],
};

function blocksOf(page: InsightPage, title: string): AppBlock[] {
  return (
    page.sections
      .flatMap((section) => section.panels)
      .find((panel) => panel.title === title)?.blocks ?? []
  );
}

describe("statsPage", () => {
  test("draws the odometer over the period", () => {
    const page = statsPage(
      {
        ...emptyStats,
        odometer: [
          { at: new Date("2026-10-01T00:00:00Z"), km: 4000 },
          { at: new Date("2026-10-10T00:00:00Z"), km: 4234.4 },
        ],
      },
      car,
      defaultPreferences,
      "30d",
      f,
      now,
    );
    const odometer = page.sections
      .flatMap((section) => section.panels)
      .find((panel) => panel.title === "Odometer (km)");
    expect(odometer?.blocks[0]?.kind).toBe("chart");
  });

  test("names the period and leaves out the cost panel without costs", () => {
    const page = statsPage(emptyStats, car, defaultPreferences, "30d", f, now);
    expect(page.subtitle).toBe("Last 30 days");
    expect(page.hero.map((stat) => stat.label)).toEqual([
      "Distance",
      "Driving time",
      "Energy used",
    ]);
    const [block] = page.heroBlocks;
    expect(
      block?.kind === "stats" ? block.stats.map((stat) => stat.label) : [],
    ).toEqual(["Charged"]);
    expect(blocksOf(page, "Distance (km)")).toEqual([
      { kind: "note", text: "No record yet." },
    ]);
    expect(
      page.sections[0]?.panels.some((panel) =>
        panel.title.startsWith("Charging cost"),
      ),
    ).toBe(false);
  });

  test("shows every hero stat when the period has drives and costs", () => {
    const page = statsPage(
      {
        ...emptyStats,
        drives: {
          drives: 2,
          distanceKm: 300,
          minutes: 240,
          usedKwh: 45,
          speedMaxKmh: 120,
          longestKm: 200,
        },
        charges: { ...emptyStats.charges, cost: 12 },
      },
      car,
      defaultPreferences,
      "30d",
      f,
      now,
    );
    expect(page.hero.map((stat) => stat.label)).toEqual([
      "Distance",
      "Driving time",
      "Energy used",
      "Efficiency",
    ]);
    const [block] = page.heroBlocks;
    expect(
      block?.kind === "stats" ? block.stats.map((stat) => stat.label) : [],
    ).toEqual(["Charged", "Charging cost", "Top speed", "Longest drive"]);
  });

  test("orders the heatmap from Sunday and links the longest drives", () => {
    const page = statsPage(
      {
        ...emptyStats,
        drives: { ...emptyStats.drives, drives: 2, distanceKm: 300 },
        starts: [{ weekday: 7, hour: 8, drives: 2 }],
        longest: [
          {
            id: 9,
            startAt: new Date("2026-10-10T06:00:00Z"),
            distanceKm: 242,
            durationMin: 159,
            from: "Bolu",
            to: "Home",
          },
        ],
      },
      car,
      { ...defaultPreferences, weekStart: "sunday" },
      "all",
      f,
      now,
    );
    const [heatmap] = blocksOf(page, "When the car drives");
    expect(heatmap).toMatchObject({ kind: "heatmap", max: 2 });
    if (heatmap?.kind === "heatmap") {
      expect(heatmap.rows[0]?.label).toBe("Sun");
      expect(heatmap.rows[0]?.values[8]).toBe(2);
    }
    const [longest] = blocksOf(page, "Longest drives");
    expect(longest).toMatchObject({
      kind: "records",
      rows: [
        {
          rank: 1,
          title: "Bolu → Home",
          value: "242 km",
          target: { kind: "drive", id: 9 },
        },
      ],
    });
  });

  test("names the update count in the Software title, because the panel ignores the period", () => {
    const page = statsPage(
      {
        ...emptyStats,
        updates: [
          {
            version: "2026.32.5",
            startAt: new Date("2026-09-01T02:00:00Z"),
            endAt: new Date("2026-09-01T02:30:00Z"),
          },
        ],
      },
      car,
      defaultPreferences,
      "7d",
      f,
      now,
    );
    const titles = page.sections.flatMap((section) =>
      section.panels.map((panel) => panel.title),
    );
    expect(titles).toContain("Software, last 12 updates");
    expect(titles).not.toContain("Software");
    expect(blocksOf(page, "Software, last 12 updates")[0]?.kind).toBe(
      "records",
    );
  });
});

describe("placesPage", () => {
  const input: PlacesInput = {
    visited: [
      {
        key: "g1",
        label: "Home",
        city: "Tempe",
        geofenceId: 1,
        visits: 20,
        parkedS: 72_000,
        lastAt: now,
        latitude: null,
        longitude: null,
      },
    ],
    charging: [
      {
        key: "g1",
        label: "Home",
        geofenceId: 1,
        sessions: 4,
        addedKwh: 80,
        cost: null,
        fast: false,
        lastAt: now,
        latitude: null,
        longitude: null,
      },
    ],
    geofences: [],
    routes: [],
    areas: { countries: [], states: [], cities: [] },
    roads: [],
  };

  test("counts the areas visited and draws every road only with maps on", () => {
    const area = (name: string, places: number, within: string | null) => ({
      key: name,
      name,
      within,
      places,
    });
    const withAreas: PlacesInput = {
      ...input,
      areas: {
        countries: [area("United States", 7, null)],
        states: [area("Arizona", 7, "United States")],
        cities: [area("Tempe", 4, "Arizona"), area("Mesa", 2, "Arizona")],
      },
      roads: [
        [
          [-111.9, 33.4],
          [-111.8, 33.42],
        ],
      ],
    };
    const page = placesPage(withAreas, defaultPreferences, "30d", f, now, true);
    expect(blocksOf(page, "Areas")[0]).toMatchObject({
      kind: "stats",
      stats: [
        { label: "Countries", value: { text: "1" }, detail: "United States" },
        { label: "States", value: { text: "1" }, detail: "Arizona" },
        { label: "Cities", value: { text: "2" }, detail: null },
      ],
    });
    const visitedTitles = (shown: InsightPage) =>
      shown.sections
        .find((section) => section.title === "Visited")
        ?.panels.map((panel) => panel.title);
    expect(visitedTitles(page)).toEqual([
      "Areas",
      "Top cities",
      "Every road driven",
    ]);
    const none = placesPage(input, defaultPreferences, "30d", f, now, true);
    expect(visitedTitles(none)).toEqual(["Areas", "Every road driven"]);
    expect(blocksOf(none, "Areas")[0]).toMatchObject({
      kind: "stats",
      stats: [
        { label: "Countries", value: { text: "0" }, detail: null },
        { label: "States", value: { text: "0" }, detail: null },
        { label: "Cities", value: { text: "0" }, detail: null },
      ],
    });
    expect(blocksOf(page, "Top cities")[0]).toMatchObject({
      kind: "records",
      rows: [
        { rank: 1, title: "Tempe", value: "4 places", detail: "Arizona" },
        { rank: 2, title: "Mesa", bar: { share: 0.5 } },
      ],
    });
    expect(blocksOf(page, "Every road driven")[0]).toMatchObject({
      kind: "routes",
    });
    const hidden = placesPage(
      withAreas,
      defaultPreferences,
      "30d",
      f,
      now,
      false,
    );
    expect(blocksOf(hidden, "Every road driven")).toEqual([
      { kind: "note", text: "Maps are off in Settings." },
    ]);
  });

  test("ranks the places and marks a place with charges", () => {
    const page = placesPage(input, defaultPreferences, "30d", f, now, true);
    expect(page.hero[1]?.value.text).toBe("100%");
    const [visited] = blocksOf(page, "Most visited");
    expect(visited).toMatchObject({
      kind: "records",
      rows: [
        {
          rank: 1,
          title: "Home",
          value: "20 visits",
          bar: { share: 1, color: "charge" },
        },
      ],
    });
    const [charging] = blocksOf(page, "Charging places");
    expect(charging).toMatchObject({
      kind: "records",
      rows: [{ badge: "AC", value: "No cost" }],
    });
  });

  test("leaves Most time out of the hero without a visited place", () => {
    const page = placesPage(
      { ...input, visited: [] },
      defaultPreferences,
      "30d",
      f,
      now,
      true,
    );
    expect(page.hero.map((stat) => stat.label)).toEqual([
      "Places",
      "Charging places",
      "Saved places",
    ]);
  });

  test("explains an empty route list and an empty geofence list", () => {
    const page = placesPage(input, defaultPreferences, "30d", f, now, true);
    expect(blocksOf(page, "Frequent routes")).toEqual([
      { kind: "note", text: "No route with 3 drives or more in this period." },
    ]);
    expect(blocksOf(page, "Geofences")).toEqual([
      { kind: "note", text: "No saved places yet." },
    ]);
  });

  test("puts the places with a position on the map, unless maps are off", () => {
    const placed: PlacesInput = {
      ...input,
      visited: [
        { ...input.visited[0]!, latitude: 33.42, longitude: -111.94 },
        { ...input.visited[0]!, key: "g2", label: "Office", latitude: null },
      ],
      charging: [
        {
          ...input.charging[0]!,
          key: "c9",
          label: "Supercharger",
          sessions: 1,
          latitude: 40.8,
          longitude: 29.4,
        },
      ],
    };
    expect(
      blocksOf(
        placesPage(placed, defaultPreferences, "30d", f, now, true),
        "Map",
      ),
    ).toEqual([
      {
        kind: "map",
        places: [
          {
            key: "g1",
            label: "Home",
            detail: "20 visits",
            latitude: 33.42,
            longitude: -111.94,
            weight: 20,
            kind: "visit",
          },
          {
            key: "c9",
            label: "Supercharger",
            detail: "1 charge",
            latitude: 40.8,
            longitude: 29.4,
            weight: 1,
            kind: "charge",
          },
        ],
      },
    ]);
    expect(
      blocksOf(
        placesPage(placed, defaultPreferences, "30d", f, now, false),
        "Map",
      ),
    ).toEqual([{ kind: "note", text: "Maps are off in Settings." }]);
    expect(
      blocksOf(
        placesPage(input, defaultPreferences, "30d", f, now, true),
        "Map",
      ),
    ).toEqual([{ kind: "note", text: "No record yet." }]);
  });
});
