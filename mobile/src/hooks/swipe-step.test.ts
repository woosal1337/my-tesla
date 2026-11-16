import { describe, expect, test } from "bun:test";
import { swipeStep } from "./swipe-step";

describe("swipeStep", () => {
  test("steps back on a swipe to the right and forward on a swipe to the left", () => {
    expect(swipeStep(60, 5, 48)).toBe(-1);
    expect(swipeStep(-60, -5, 48)).toBe(1);
  });

  test("ignores a short or a mostly vertical move", () => {
    expect(swipeStep(30, 0, 48)).toBe(0);
    expect(swipeStep(60, 40, 48)).toBe(0);
    expect(swipeStep(60, 30, 48)).toBe(0);
    expect(swipeStep(0, 0, 12)).toBe(0);
  });
});
