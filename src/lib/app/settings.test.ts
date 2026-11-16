import { describe, expect, test } from "bun:test";
import { defaultPreferences, overviewKeys } from "../preferences";
import { applySetting, settingsPage } from "./settings";

const base = defaultPreferences;

describe("settingsPage", () => {
  test("lists the groups of the web Settings that change the app", () => {
    const page = settingsPage(base, ["Europe/Istanbul"], "Europe/Berlin");
    expect(page.groups.map((group) => group.title)).toEqual([
      "Units",
      "Date and time",
      "Numbers",
      "Charging cost",
      "Location",
      "Insights",
      "Overview",
      "Status and Location",
    ]);
    const zone = page.groups[1]?.items[0];
    expect(zone).toMatchObject({ key: "timeZone", value: "auto" });
    if (zone?.kind === "choice") {
      expect(zone.options[0]).toEqual({
        id: "auto",
        label: "Automatic (Europe/Berlin)",
      });
    }
    expect(page.groups[4]?.items.map((item) => item.key)).toEqual([
      "placeNames",
      "addressDetail",
      "maps",
      "mapTheme",
    ]);
  });

  test("puts each switch in the group of the screen that it changes", () => {
    const page = settingsPage(base, [], "UTC");
    const group = (title: string) =>
      page.groups.find((entry) => entry.title === title)?.items ?? [];
    const keys = (title: string) => group(title).map((item) => item.key);
    expect(keys("Insights")).toEqual(["period"]);
    expect(keys("Overview")).toEqual(["overview.render", "overview.recent"]);
    expect(group("Overview")[0]).toEqual({
      key: "overview.render",
      kind: "switch",
      label: "Car image",
      hint: null,
      value: true,
    });
    expect(keys("Status and Location")).toEqual([
      "overview.live",
      "overview.today",
      "overview.tires",
      "overview.location",
    ]);
    const switches = page.groups
      .flatMap((entry) => entry.items.map((item) => item.key))
      .filter((key) => key.startsWith("overview."));
    expect(switches.toSorted()).toEqual(
      overviewKeys.map(({ id }) => `overview.${id}`).toSorted(),
    );
  });

  test("previews the sample values in the chosen units", () => {
    const page = settingsPage(
      { ...base, distance: "mi", clock: "12h" },
      [],
      "UTC",
    );
    expect(page.preview[0]).toMatchObject({
      label: "Distance",
      value: { text: "95 mi" },
    });
    expect(page.preview.at(-1)?.value.text).toBe("11:05 AM");
  });
});

describe("applySetting", () => {
  test("changes one choice and keeps the others", () => {
    const next = applySetting(base, { key: "distance", value: "mi" }, base);
    expect(next?.distance).toBe("mi");
    expect(next?.temperature).toBe(base.temperature);
  });

  test("turns a card off", () => {
    const next = applySetting(
      base,
      { key: "overview.tires", value: false },
      base,
    );
    expect(next?.overview.tires).toBe(false);
    expect(next?.overview.live).toBe(true);
  });

  test("reads a price with a comma and clears an empty price", () => {
    expect(
      applySetting(base, { key: "chargePrice", value: "4,857" }, base)
        ?.chargePrice,
    ).toBe(4.857);
    expect(
      applySetting(
        { ...base, chargePrice: 3 },
        { key: "chargePrice", value: "" },
        base,
      )?.chargePrice,
    ).toBeNull();
  });

  test("refuses unknown keys, unknown values, and web-only settings", () => {
    expect(
      applySetting(base, { key: "distance", value: "yards" }, base),
    ).toBeNull();
    expect(
      applySetting(base, { key: "chargePrice", value: "abc" }, base),
    ).toBeNull();
    expect(
      applySetting(base, { key: "overview.maps", value: true }, base),
    ).toBeNull();
    expect(
      applySetting(base, { key: "theme", value: "dark" }, base),
    ).toBeNull();
    expect(
      applySetting(base, { key: "timeZone", value: "Mars/Base" }, base),
    ).toBeNull();
  });
});
