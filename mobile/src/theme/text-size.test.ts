import { describe, expect, test } from "bun:test";
import { axisScale, iconScale, isLargeText } from "./text-size";

describe("isLargeText", () => {
  test("keeps the default layout up to the size XXL", () => {
    expect(isLargeText(1)).toBe(false);
    expect(isLargeText(1.235)).toBe(false);
  });

  test("uses the large layout from 1.3, at XXXL, and at AX5", () => {
    expect(isLargeText(1.3)).toBe(true);
    expect(isLargeText(1.353)).toBe(true);
    expect(isLargeText(3.571)).toBe(true);
  });
});

describe("iconScale", () => {
  test("never shrinks an icon below its size", () => {
    expect(iconScale(0.823)).toBe(1);
  });

  test("follows the text up to 1.5 times", () => {
    expect(iconScale(1.353)).toBe(1.353);
    expect(iconScale(2)).toBe(1.5);
    expect(iconScale(3.571)).toBe(1.5);
  });
});

describe("axisScale", () => {
  test("keeps the axis width below the default text size", () => {
    expect(axisScale(0.823)).toBe(1);
    expect(axisScale(1)).toBe(1);
  });

  test("follows the tick labels up to 1.2 times", () => {
    expect(axisScale(1.118)).toBe(1.118);
    expect(axisScale(1.353)).toBe(1.2);
    expect(axisScale(3.571)).toBe(1.2);
  });
});
