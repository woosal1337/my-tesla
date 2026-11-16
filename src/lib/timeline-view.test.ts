import { describe, expect, test } from "bun:test";
import { createFormatter } from "./format";
import { dayWindow } from "./insights";
import { defaultPreferences } from "./preferences";
import {
  dayLegend,
  isQuietDay,
  lastActiveDay,
  restShare,
  timelineView,
} from "./timeline-view";

const window = dayWindow("2026-10-17", "UTC");
const minute = 60_000;
const dayMs = 1440 * minute;

describe("restShare", () => {
  test("names sleep when the car only slept", () => {
    expect(restShare(360 * minute, 0, dayMs)).toEqual({
      label: "Asleep",
      percent: 25,
      detail: "of the recorded time",
    });
  });

  test("names offline time when the car was offline longer", () => {
    expect(restShare(0, 1059 * minute, dayMs)).toEqual({
      label: "Offline",
      percent: 74,
      detail: "of the recorded time",
    });
    expect(restShare(144 * minute, 720 * minute, dayMs)).toEqual({
      label: "Offline",
      percent: 50,
      detail: "of the recorded time · asleep 10%",
    });
  });

  test("names the offline share under a longer sleep", () => {
    expect(restShare(720 * minute, 432 * minute, dayMs)).toEqual({
      label: "Asleep",
      percent: 50,
      detail: "of the recorded time · offline 30%",
    });
  });

  test("ignores an offline blip", () => {
    expect(restShare(600 * minute, minute, dayMs)).toEqual({
      label: "Asleep",
      percent: 42,
      detail: "of the recorded time",
    });
  });

  test("gives 0% without recorded time", () => {
    expect(restShare(0, 0, 0)).toEqual({
      label: "Asleep",
      percent: 0,
      detail: "of the recorded time",
    });
  });
});

describe("timelineView", () => {
  test("shows a day spent offline as offline time", () => {
    const f = createFormatter(defaultPreferences, "UTC");
    const at = (time: string) => new Date(`2026-10-17T${time}:00Z`);
    const view = timelineView(
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
          {
            id: 1,
            start: at("17:39"),
            end: at("17:57"),
            from: "Home",
            to: "Office",
            distanceKm: 12,
          },
        ],
        charges: [],
      },
      window,
      new Date("2026-10-18T09:00:00Z"),
      f,
    );
    expect(view.rest.label).toBe("Offline");
    expect(view.segments[0]).toMatchObject({
      kind: "offline",
      start: at("00:00"),
      end: at("17:39"),
    });
    expect(
      view.rows.find((row) => row.item.kind === "parked")?.detail,
    ).toContain(`offline ${f.duration(1059)}`);
  });
});

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
