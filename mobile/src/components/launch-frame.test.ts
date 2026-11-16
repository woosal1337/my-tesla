import { describe, expect, test } from "bun:test";
import { launchFrame, launchMarkSize } from "./launch-frame";

const heights = [568, 667, 812, 844, 874, 956, 1194, 1366];
const gap = 16;

describe("launchFrame", () => {
  test("centers the mark in the window, as the launch splash does", () => {
    for (const height of heights) {
      const { markTop } = launchFrame(height, gap);
      expect(markTop + launchMarkSize / 2).toBe(height / 2);
    }
  });

  test("starts the content one gap below the mark", () => {
    for (const height of heights) {
      const { markTop, contentTop } = launchFrame(height, gap);
      expect(contentTop).toBe(markTop + launchMarkSize + gap);
    }
  });

  test("puts all content in the lower half of the window", () => {
    for (const height of heights) {
      expect(launchFrame(height, gap).contentTop).toBeGreaterThan(height / 2);
    }
  });
});
