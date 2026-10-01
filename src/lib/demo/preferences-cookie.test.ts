import { expect, test } from "bun:test";
import { readPreferencesCookie } from "./preferences-cookie";

test("reads saved demo settings from the cookie", () => {
  expect(readPreferencesCookie('{"distance":"mi"}')).toEqual({
    distance: "mi",
  });
});

test("ignores a missing, broken, or oversized cookie", () => {
  expect(readPreferencesCookie(undefined)).toBeNull();
  expect(readPreferencesCookie("{broken")).toBeNull();
  expect(readPreferencesCookie(`"${"x".repeat(4000)}"`)).toBeNull();
});
