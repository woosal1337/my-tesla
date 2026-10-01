import { expect, test } from "bun:test";
import { defaultTimeZone, readTimeZone } from "./time-zone";

test("uses UTC when no time zone is set", () => {
  expect(readTimeZone({})).toBe(defaultTimeZone);
  expect(readTimeZone({ DISPLAY_TIME_ZONE: "  " })).toBe(defaultTimeZone);
});

test("accepts an IANA time zone", () => {
  expect(readTimeZone({ DISPLAY_TIME_ZONE: "Europe/Berlin" })).toBe(
    "Europe/Berlin",
  );
});

test("refuses an unknown time zone", () => {
  expect(() => readTimeZone({ DISPLAY_TIME_ZONE: "Mars/Olympus" })).toThrow(
    'not "Mars/Olympus"',
  );
});
