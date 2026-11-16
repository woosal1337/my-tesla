import { describe, expect, test } from "bun:test";
import { coverAfter } from "./map-cover";

describe("coverAfter", () => {
  test("lifts the cover when the map renders or the time runs out", () => {
    expect(coverAfter("loading", "rendered")).toBe("lifted");
    expect(coverAfter("loading", "timeout")).toBe("lifted");
  });

  test("keeps a failed map covered until it renders", () => {
    expect(coverAfter("loading", "failed")).toBe("failed");
    expect(coverAfter("failed", "timeout")).toBe("failed");
    expect(coverAfter("failed", "rendered")).toBe("lifted");
  });

  test("never covers a map again", () => {
    expect(coverAfter("lifted", "failed")).toBe("lifted");
  });
});
