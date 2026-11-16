import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import type { Car } from "../queries";
import type { AppPanel } from "./contract";
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

function panelOf(input: StatsInput, title: string): AppPanel | undefined {
  return statsPage(input, car, defaultPreferences, "30d", f, now)
    .sections.flatMap((section) => section.panels)
    .find((panel) => panel.title === title);
}

function sharesOf(panel: AppPanel | undefined) {
  const block = panel?.blocks[0];
  return block?.kind === "shares" ? block.rows : [];
}

describe("statsPage share bars", () => {
  test("draws the temperature bars as the share of the distance", () => {
    const panel = panelOf(
      {
        ...emptyStats,
        efficiency: [
          { temperature: 22, distanceKm: 30, usedKwh: 6 },
          { temperature: 27, distanceKm: 90, usedKwh: 9 },
        ],
      },
      "By temperature",
    );
    expect(panel?.note).toBe("Share of distance");
    expect(
      sharesOf(panel).map(({ label, share, text }) => ({ label, share, text })),
    ).toEqual([
      { label: "20 to 25 °C", share: 0.25, text: "30 km · 200 Wh/km" },
      { label: "25 to 30 °C", share: 0.75, text: "90 km · 100 Wh/km" },
    ]);
  });

  test("draws the speed bars as the share of the driving time", () => {
    const panel = panelOf(
      {
        ...emptyStats,
        speedRows: [
          { band: 1, points: 25, powerSum: 4, speedSum: 20 },
          { band: 3, points: 75, powerSum: 6, speedSum: 60 },
        ],
      },
      "By speed",
    );
    expect(panel?.note).toBe("Share of driving time");
    expect(sharesOf(panel).map(({ share, text }) => ({ share, text }))).toEqual(
      [
        { share: 0.25, text: "25% · 200 Wh/km" },
        { share: 0.75, text: "75% · 100 Wh/km" },
      ],
    );
  });

  test("leaves out the note and the bars without bands", () => {
    for (const title of ["By temperature", "By speed"]) {
      const panel = panelOf(emptyStats, title);
      expect(panel?.note).toBeNull();
      expect(panel?.blocks).toEqual([{ kind: "note", text: "No record yet." }]);
    }
  });
});
