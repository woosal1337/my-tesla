import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { dayWindow } from "../insights";
import { defaultPreferences } from "../preferences";
import { timelinePage } from "./timeline";

const f = createFormatter(defaultPreferences, "UTC");
const now = new Date("2026-10-18T20:00:00Z");
const at = (time: string) => new Date(`2026-10-17T${time}:00Z`);

const records = {
  states: [{ state: "asleep" as const, start: at("00:00"), end: at("08:00") }],
  drives: [
    {
      id: 7,
      start: at("08:00"),
      end: at("08:30"),
      from: "Home",
      to: "Office",
      distanceKm: 20,
    },
  ],
  charges: [
    {
      id: 9,
      start: at("18:00"),
      end: at("19:00"),
      place: "Home",
      energyAddedKwh: 12.5,
      fast: false,
    },
  ],
};

describe("timelinePage", () => {
  test("lists the day with links, totals, and the day around it", () => {
    const window = dayWindow("2026-10-17", "UTC");
    const page = timelinePage(
      records,
      "2026-10-17",
      "2026-10-18",
      window,
      f,
      now,
      null,
    );
    expect(page.title).toBe("Yesterday");
    expect(page.previous).toBe("2026-10-16");
    expect(page.next).toBe("2026-10-18");
    expect(page.stats.map((stat) => stat.value.text)).toEqual([
      "20 km",
      f.duration(30),
      "12.5 kWh",
      expect.stringMatching(/%$/),
    ]);
    const drive = page.rows.find((row) => row.kind === "drive");
    expect(drive).toMatchObject({
      title: "Drive to Office",
      target: { kind: "drive", id: 7 },
    });
    expect(page.rows.find((row) => row.kind === "charge")).toMatchObject({
      title: "Charged at Home",
      target: { kind: "charge", id: 9 },
    });
    expect(page.strip.segments.length).toBeGreaterThan(0);
    expect(page.strip.legend).toHaveLength(5);
    expect(page.lastActive).toBeNull();
  });

  test("links a quiet day to the last day with a drive or a charge", () => {
    const page = timelinePage(
      {
        states: [{ state: "asleep", start: at("00:00"), end: at("23:59") }],
        drives: [],
        charges: [],
      },
      "2026-10-17",
      "2026-10-18",
      dayWindow("2026-10-17", "UTC"),
      f,
      now,
      new Date("2026-10-14T09:00:00Z"),
    );
    expect(page.lastActive).toEqual({
      day: "2026-10-14",
      title: "No drive and no charge on this day",
      detail: `Open the last day with one: ${f.day(new Date("2026-10-14T09:00:00Z"), now)}`,
    });
    expect(page.stats.map((stat) => stat.label)).toEqual(["Asleep"]);
  });

  test("counts a day spent offline as offline time", () => {
    const page = timelinePage(
      {
        states: [
          { state: "offline", start: at("00:00"), end: at("17:39") },
          {
            state: "online",
            start: at("17:39"),
            end: new Date("2026-10-18T00:00:00Z"),
          },
        ],
        drives: [
          { ...records.drives[0], start: at("17:39"), end: at("17:57") },
        ],
        charges: [],
      },
      "2026-10-17",
      "2026-10-18",
      dayWindow("2026-10-17", "UTC"),
      f,
      now,
      null,
    );
    expect(page.stats.at(-1)).toMatchObject({
      label: "Offline",
      value: { text: "74%" },
      detail: "of the recorded time",
    });
    expect(page.stats.some((stat) => stat.label === "Asleep")).toBe(false);
    expect(page.strip.segments[0]).toMatchObject({ kind: "offline", start: 0 });
    expect(page.strip.segments[0]?.end).toBeCloseTo(1059 / 1440);
  });

  test("has no next day on today", () => {
    const page = timelinePage(
      { states: [], drives: [], charges: [] },
      "2026-10-18",
      "2026-10-18",
      dayWindow("2026-10-18", "UTC"),
      f,
      now,
      null,
    );
    expect(page.next).toBeNull();
    expect(page.rows).toEqual([]);
    expect(page.stats).toEqual([]);
    expect(page.lastActive).toBeNull();
    expect(page.strip.legend?.at(-1)).toEqual({ kind: "now", label: "Now" });
    expect(page.strip.legend).toHaveLength(6);
  });
});
