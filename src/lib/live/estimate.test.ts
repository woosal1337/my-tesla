import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import { finishText } from "./estimate";

const zone = "Europe/Istanbul";
const f = createFormatter(defaultPreferences, zone);
const twelveHour = createFormatter(
  { ...defaultPreferences, clock: "12h" },
  zone,
);
const now = new Date("2026-10-05T19:00:00Z");

describe("finishText", () => {
  test("gives the clock for a charge that ends today", () => {
    expect(finishText(new Date("2026-10-05T20:45:00Z"), 80, f, now)).toBe(
      "80% at 23:45",
    );
    expect(
      finishText(new Date("2026-10-05T20:45:00Z"), 80, twelveHour, now),
    ).toBe("80% at 11:45 PM");
  });

  test("adds the day for a charge that ends after midnight", () => {
    expect(finishText(new Date("2026-10-05T23:15:00Z"), 90, f, now)).toMatch(
      /^90% at .*6 Oct 02:15$/,
    );
  });

  test("says full without a charge limit", () => {
    expect(finishText(new Date("2026-10-05T20:00:00Z"), null, f, now)).toBe(
      "Full at 23:00",
    );
  });
});
