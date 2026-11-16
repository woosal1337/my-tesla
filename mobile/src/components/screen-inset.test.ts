import { describe, expect, test } from "bun:test";
import { readableWidth, screenInset } from "./screen-inset";

const padding = 20;

describe("screenInset", () => {
  test("keeps the padding on a phone", () => {
    expect(screenInset(393, padding)).toBe(20);
  });

  test("keeps the padding up to a window of the column and two paddings", () => {
    expect(screenInset(712, padding)).toBe(20);
    expect(screenInset(713, padding)).toBe(20.5);
  });

  test("centers the column on an iPad Pro 11 in both orientations", () => {
    expect(screenInset(834, padding)).toBe(81);
    expect(screenInset(1210, padding)).toBe(269);
  });

  test("leaves the readable width between the insets of a wide window", () => {
    for (const width of [834, 1210]) {
      expect(width - 2 * screenInset(width, padding)).toBe(readableWidth);
    }
  });
});
