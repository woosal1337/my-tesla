import { expect, test } from "bun:test";
import { isDemoMode } from "./mode";

test("turns demo mode on only for 1 or true", () => {
  expect(isDemoMode({ DEMO_MODE: "1" })).toBe(true);
  expect(isDemoMode({ DEMO_MODE: " True " })).toBe(true);
  expect(isDemoMode({ DEMO_MODE: "0" })).toBe(false);
  expect(isDemoMode({})).toBe(false);
});
