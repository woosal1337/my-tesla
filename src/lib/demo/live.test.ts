import { describe, expect, test } from "bun:test";
import { createFormatter } from "@/lib/format";
import { islandActivity } from "@/lib/live/island";
import { liveView } from "@/lib/live/view";
import { defaultPreferences } from "@/lib/preferences";
import { demoCarId } from "./generate";
import { demoLiveValues } from "./live";

describe("demoLiveValues", () => {
  test("gives the demo car a charge, an update ready, and no tire values", () => {
    const now = Date.UTC(2026, 10, 27, 12);
    const view = liveView(demoLiveValues(demoCarId), {}, now);
    expect(view.state).toBe("charging");
    expect(view.charging.state).toBe("Charging");
    expect(view.charging.powerKw).toBe(11);
    expect(view.charging.fullAt?.getTime()).toBe(now + 2.5 * 3_600_000);
    expect(
      islandActivity(view, createFormatter(defaultPreferences, "UTC"))?.key,
    ).toBe("charging");
    expect(view.locked).toBe(true);
    expect(view.openParts).toEqual([]);
    expect(view.software.updateVersion).toBe("2026.32.6");
    expect(view.tires).toBeNull();
  });

  test("gives no values for an unknown car", () => {
    expect(demoLiveValues(99)).toEqual({});
  });
});
