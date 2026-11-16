import { describe, expect, test } from "bun:test";
import { headerCoversScreen, stickyRange } from "./sticky-geometry";

describe("stickyRange", () => {
  test("keeps a heading in place before its layout is known", () => {
    expect(stickyRange(null, undefined)).toEqual({
      inputRange: [-1, 0],
      outputRange: [0, 0],
    });
  });

  test("pins the last heading from its own top onward", () => {
    expect(stickyRange({ y: 200, height: 36 }, undefined)).toEqual({
      inputRange: [-1, 0, 200, 201],
      outputRange: [0, 0, 0, 1],
    });
  });

  test("lets the next heading push a pinned heading up", () => {
    expect(stickyRange({ y: 200, height: 36 }, 500)).toEqual({
      inputRange: [-1, 0, 200, 464, 465],
      outputRange: [0, 0, 0, 264, 264],
    });
  });

  test("never lets the input range go down for a heading at the top", () => {
    expect(stickyRange({ y: 0, height: 36 }, 36)).toEqual({
      inputRange: [-1, 0, 0, 0, 1],
      outputRange: [0, 0, 0, 0, 0],
    });
  });
});

describe("headerCoversScreen", () => {
  test("is true on iOS 26 and later for every title", () => {
    expect(headerCoversScreen("ios", "27.0", false)).toBe(true);
  });

  test("is true for a large title before iOS 26", () => {
    expect(headerCoversScreen("ios", "18.5", true)).toBe(true);
  });

  test("is false for a small title before iOS 26", () => {
    expect(headerCoversScreen("ios", "18.5", false)).toBe(false);
  });

  test("is false on Android", () => {
    expect(headerCoversScreen("android", 36, true)).toBe(false);
  });
});
