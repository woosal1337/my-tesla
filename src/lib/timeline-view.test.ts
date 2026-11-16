import { describe, expect, test } from "bun:test";
import { createFormatter } from "./format";
import { dayWindow } from "./insights";
import { defaultPreferences } from "./preferences";
import { dayLegend, isQuietDay, lastActiveDay } from "./timeline-view";

const window = dayWindow("2026-10-17", "UTC");

describe("dayLegend", () => {
  test("names the five kinds and adds Now only inside the day", () => {
    const past = dayLegend(window, new Date("2026-10-18T09:00:00Z"));
    expect(past.map((entry) => entry.label)).toEqual([
      "Driving",
      "Charging",
      "Awake",
      "Asleep",
      "Offline",
    ]);
    const today = dayLegend(window, new Date("2026-10-17T09:00:00Z"));
    expect(today.at(-1)).toEqual({ kind: "now", label: "Now" });
    expect(today).toHaveLength(6);
  });
});

describe("isQuietDay", () => {
  test("is true only without a drive and a charge", () => {
    expect(isQuietDay({ drives: [], charges: [] })).toBe(true);
    expect(isQuietDay({ drives: [{}], charges: [] })).toBe(false);
    expect(isQuietDay({ drives: [], charges: [{}] })).toBe(false);
  });
});

describe("lastActiveDay", () => {
  test("gives the local day of the last drive or charge", () => {
    const f = createFormatter(defaultPreferences, "America/Phoenix");
    const now = new Date("2026-10-18T10:00:00Z");
    expect(lastActiveDay(null, f, now)).toBeNull();
    expect(lastActiveDay(new Date("2026-10-17T05:30:00Z"), f, now)).toEqual({
      day: "2026-10-16",
      title: "No drive and no charge on this day",
      detail: `Open the last day with one: ${f.day(new Date("2026-10-17T05:30:00Z"), now)}`,
    });
  });
});
