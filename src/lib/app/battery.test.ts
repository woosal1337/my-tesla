import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import { batteryPage, type BatteryInput } from "./battery";

const f = createFormatter(defaultPreferences, "Europe/Istanbul");
const now = new Date("2026-10-17T15:00:00Z");

const empty: BatteryInput = {
  capacity: [],
  latest: { rangeAt100Km: null, at: null },
  totals: { sessions: 0, addedKwh: 0, usedKwh: 0, acKwh: 0, dcKwh: 0 },
  levels: [],
  charges: [],
  idle: [],
  minimumKwh: 45,
  levelTrend: [],
  ranges: { byTemperature: [], byLevel: [] },
  states: [],
  lfpBattery: false,
};

describe("batteryPage", () => {
  test("says how many long charges the health estimate needs", () => {
    const page = batteryPage(empty, "30d", f, now);
    expect(page.hero[0]).toMatchObject({
      label: "Health",
      value: { text: "—" },
      detail: "Needs 3 charges of 45 kWh or more",
    });
    expect(page.heroBlocks).toEqual([]);
    expect(page.sections[1]).toMatchObject({
      title: "Habits",
      subtitle: "Last 30 days",
      period: true,
    });
    const blocks = page.sections.flatMap((section) =>
      section.panels.flatMap((panel) => panel.blocks),
    );
    expect(blocks.every((block) => block.kind === "note")).toBe(true);
  });

  test("splits the charged energy into AC and DC shares", () => {
    const page = batteryPage(
      {
        ...empty,
        totals: {
          sessions: 4,
          addedKwh: 100,
          usedKwh: 110,
          acKwh: 75,
          dcKwh: 25,
        },
      },
      "all",
      f,
      now,
    );
    const energy = page.sections[0]?.panels.find(
      (panel) => panel.title === "Charging energy",
    );
    expect(energy?.blocks[0]).toMatchObject({
      kind: "stats",
      stats: [
        { label: "Added", value: { text: "100 kWh" }, detail: "4 sessions" },
        { label: "Efficiency", value: { text: "91%" } },
      ],
    });
    expect(energy?.blocks[1]).toMatchObject({
      kind: "shares",
      rows: [
        {
          label: "AC",
          share: 0.75,
          text: "75 kWh · 75%",
          color: "charge",
        },
        {
          label: "DC fast",
          share: 0.25,
          text: "25 kWh · 25%",
          color: "primary",
        },
      ],
    });
    expect(page.sections[1]?.subtitle).toBe("All records");
  });

  test("adds the charge level, the car states, the projected range, and the advice", () => {
    const day = 24 * 60 * 60 * 1000;
    const page = batteryPage(
      {
        ...empty,
        lfpBattery: true,
        charges: [
          {
            startLevel: 50,
            endLevel: 100,
            endAt: new Date(now.getTime() - 2 * day),
          },
        ],
        levelTrend: [
          { at: new Date(now.getTime() - day), level: 80, usableLevel: 80 },
          { at: now, level: 70, usableLevel: 70 },
        ],
        states: [
          { state: "online", seconds: 3600 },
          { state: "asleep", seconds: 3 * 3600 },
        ],
        ranges: {
          byTemperature: [
            { value: 10, samples: 1, rangeKm: 400, level: 80, usableLevel: 80 },
            { value: 20, samples: 1, rangeKm: 420, level: 80, usableLevel: 80 },
          ],
          byLevel: [
            { value: 50, samples: 1, rangeKm: 250, level: 50, usableLevel: 50 },
            { value: 80, samples: 1, rangeKm: 410, level: 80, usableLevel: 80 },
          ],
        },
      },
      "30d",
      f,
      now,
    );
    const panels = page.sections.flatMap((section) => section.panels);
    const titled = (title: string) =>
      panels.find((item) => item.title === title);
    const advice = titled("Charging advice")?.blocks ?? [];
    expect(advice[0]).toMatchObject({
      kind: "note",
      role: "body",
      text: expect.stringContaining("LFP battery"),
    });
    expect(advice[1]).toMatchObject({
      role: "body",
      text: "The last full charge was 2 days ago.",
    });
    expect(advice.at(-1)).toMatchObject({
      kind: "note",
      role: "caption",
      text: expect.stringContaining("TeslaMate sets the battery type"),
    });
    expect(titled("Charge level (%)")?.blocks[0]?.kind).toBe("chart");
    const levels = titled("Charge start and end levels")?.blocks[0];
    expect(
      levels?.kind === "chart" &&
        levels.chart.left.ticks.map((tick) => tick.value),
    ).toEqual([0, 1]);
    expect(titled("Time in each state")?.blocks[0]).toMatchObject({
      kind: "shares",
      rows: [
        { label: "Online", share: 0.25 },
        { label: "Asleep", share: 0.75 },
        { label: "Offline", share: 0 },
      ],
    });
    expect(titled("Time in each state")?.blocks[1]).toEqual({
      kind: "note",
      role: "caption",
      text: "Online includes driving and charging.",
    });
    expect(
      titled("Projected range (km)")?.blocks.map((block) =>
        block.kind === "chart" ? block.chart.caption : block.kind,
      ),
    ).toEqual(["By outside temperature (°C)", "By battery level (%)"]);
  });
});
