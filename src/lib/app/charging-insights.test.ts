import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import {
  chargingInsightsPage,
  type ChargingInsightsInput,
} from "./charging-insights";

const f = createFormatter(defaultPreferences, "Europe/Istanbul");

const input: ChargingInsightsInput = {
  types: [
    { fast: false, sessions: 3, addedKwh: 60, cost: 12, costedKwh: 60 },
    { fast: true, sessions: 1, addedKwh: 40, cost: 20, costedKwh: 40 },
  ],
  starts: [{ weekday: 1, hour: 21, drives: 3 }],
  curves: [
    {
      id: 5,
      startAt: new Date("2026-10-01T10:00:00Z"),
      points: [
        { level: 20, power: 150 },
        { level: 60, power: 90 },
      ],
    },
  ],
  places: [
    {
      key: "g1",
      label: "Home",
      geofenceId: 1,
      sessions: 3,
      addedKwh: 60,
      cost: 12,
      fast: false,
      lastAt: new Date("2026-10-01T10:00:00Z"),
      latitude: null,
      longitude: null,
    },
  ],
  drivenKm: 500,
  levelTimes: [],
  batteryLevel: 55,
};

describe("chargingInsightsPage", () => {
  test("gives the totals, the curves, the heatmap, and the places", () => {
    const page = chargingInsightsPage(input, "30d", false, f);
    expect(page.title).toBe("Charging insights");
    expect(page.hero.map((stat) => stat.label)).toEqual([
      "Sessions",
      "Energy added",
      "Cost per kWh",
      "Cost per 100 km",
    ]);
    expect(page.hero[0]?.value.text).toBe("4");
    expect(page.heroBlocks[0]).toMatchObject({
      kind: "stats",
      stats: [{ label: "AC charging" }, { label: "DC fast charging" }],
    });
    const panels = page.sections[0]?.panels ?? [];
    const titled = (title: string) =>
      panels.find((item) => item.title === title)?.blocks ?? [];
    expect(titled("DC charging curves (kW)")[0]?.kind).toBe("chart");
    expect(titled("When the car charges")[0]).toMatchObject({
      kind: "heatmap",
      unit: "charges",
    });
    expect(titled("Top charging places")[0]).toMatchObject({
      kind: "records",
      rows: [{ title: "Home", badge: "AC" }],
    });
  });

  test("says so for a period without charges", () => {
    const page = chargingInsightsPage(
      { ...input, types: [], curves: [], places: [] },
      "7d",
      false,
      f,
    );
    expect(page.heroBlocks).toEqual([
      { kind: "note", text: "No charge in this period." },
    ]);
    expect(page.sections).toEqual([]);
  });

  test("heads each charge time table and explains the times below them", () => {
    const steps = (fast: boolean, from: number, to: number, sessions: number) =>
      Array.from({ length: to - from }, (_, index) => ({
        fast,
        level: from + index,
        sessions,
        typicalS: 60,
        slowS: 90,
      }));
    const page = chargingInsightsPage(
      {
        ...input,
        curves: [],
        levelTimes: [...steps(true, 10, 90, 4), ...steps(false, 20, 100, 3)],
      },
      "30d",
      false,
      f,
    );
    const blocks =
      page.sections[0]?.panels.find((item) => item.title === "Charging time")
        ?.blocks ?? [];
    expect(
      blocks.map((block) =>
        block.kind === "note" ? [block.role, block.text] : block.kind,
      ),
    ).toEqual([
      ["heading", "DC fast charging: 4 charges, 10% to 90%"],
      "table",
      ["heading", "AC charging: 3 charges, 20% to 100%"],
      "table",
      [
        "caption",
        "The time that past charges spent at each battery percent. The slow time fits a cold battery or a busy charger.",
      ],
    ]);
    expect(
      page.sections[0]?.panels.find(
        (item) => item.title === "DC charging curves (kW)",
      )?.blocks,
    ).toEqual([{ kind: "note", text: "No DC fast charge in this period." }]);
  });

  test("names two curves of one day by their start time and dashes the later curves", () => {
    const curve = (id: number, startAt: string) => ({
      id,
      startAt: new Date(startAt),
      points: [
        { level: 20, power: 150 },
        { level: 60, power: 90 },
      ],
    });
    const page = chargingInsightsPage(
      {
        ...input,
        curves: [
          curve(1, "2026-11-08T06:12:00Z"),
          curve(2, "2026-11-08T14:40:00Z"),
          curve(3, "2026-11-05T10:00:00Z"),
        ],
      },
      "30d",
      false,
      f,
    );
    const block = page.sections[0]?.panels.find(
      (item) => item.title === "DC charging curves (kW)",
    )?.blocks[0];
    const series = block?.kind === "chart" ? block.chart.series : [];
    expect(series.map((entry) => entry.label)).toEqual([
      "8 Nov 09:12",
      "8 Nov 17:40",
      "5 Nov",
    ]);
    expect(series.map((entry) => entry.dash)).toEqual([
      undefined,
      "dashed",
      "dotted",
    ]);
  });
});
