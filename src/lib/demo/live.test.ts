import { describe, expect, test } from "bun:test";
import { liveView } from "@/lib/live/view";
import { demoCarId } from "./generate";
import { demoLiveValues } from "./live";

describe("demoLiveValues", () => {
  test("gives the demo car a parked state with an update ready and no tire values", () => {
    const view = liveView(demoLiveValues(demoCarId));
    expect(view.locked).toBe(true);
    expect(view.openParts).toEqual([]);
    expect(view.software.updateVersion).toBe("2026.32.6");
    expect(view.tires).toBeNull();
  });

  test("gives no values for an unknown car", () => {
    expect(demoLiveValues(99)).toEqual({});
  });
});
