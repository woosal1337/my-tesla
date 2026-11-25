import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import { islandActivity } from "./island";
import { liveView } from "./view";

const f = createFormatter(defaultPreferences, "Europe/Istanbul");
const island = (values: Record<string, string>) =>
  islandActivity(liveView(values, {}, 0), f);

describe("islandActivity", () => {
  test("shows nothing for a parked car that is up to date", () => {
    expect(
      island({
        shift_state: "P",
        version: "2026.20.3",
        update_available: "false",
      }),
    ).toBeNull();
  });

  test("shows the download progress of an update", () => {
    expect(
      island({
        update_available: "true",
        update_version: "2026.32.1",
        download_perc: "42.4",
      }),
    ).toMatchObject({
      key: "software",
      title: "Downloading update",
      value: "42%",
      progress: 42.4,
    });
  });

  test("shows the version of an update that is ready", () => {
    expect(
      island({ update_available: "true", update_version: "2026.32.1" }),
    ).toMatchObject({
      title: "Update ready",
      value: "2026.32.1",
      progress: null,
    });
  });

  test("shows an install before a finished download", () => {
    expect(
      island({
        update_available: "true",
        download_perc: "100",
        install_perc: "65",
      }),
    ).toMatchObject({ title: "Installing update", progress: 65 });
  });

  test("puts a charge before a waiting update", () => {
    expect(
      island({
        charging_state: "Charging",
        charger_power: "11",
        time_to_full_charge: "1.5",
        update_available: "true",
      }),
    ).toMatchObject({ key: "charging", value: "11 kW", tone: "charge" });
  });

  test("puts a drive before a charge", () => {
    expect(
      island({ shift_state: "D", speed: "62", charging_state: "Charging" }),
    ).toMatchObject({ key: "driving", title: "Driving", value: "62 km/h" });
  });
});
