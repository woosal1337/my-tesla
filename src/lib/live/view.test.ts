import { describe, expect, test } from "bun:test";
import { liveView, updatePhase } from "./view";

const parked = {
  state: "online",
  since: "2026-10-01T11:41:31.770000Z",
  locked: "true",
  sentry_mode: "true",
  is_user_present: "false",
  doors_open: "false",
  windows_open: "false",
  trunk_open: "false",
  frunk_open: "false",
  driver_front_door_open: "false",
  plugged_in: "false",
  charging_state: "Disconnected",
  charge_limit_soc: "100",
  charger_power: "0",
  time_to_full_charge: "0.0",
  charge_port_door_open: "false",
  charge_current_request: "16",
  charge_current_request_max: "16",
  shift_state: "P",
  speed: "0",
  is_climate_on: "false",
  is_preconditioning: "false",
  climate_keeper_mode: "off",
  inside_temp: "22.2",
  version: "2026.20.300",
  update_available: "false",
  download_perc: "0",
  install_perc: "0",
  software_update: '{"installed_version":"2026.20.300","latest_version":""}',
  tpms_pressure_fl: "2.75",
  tpms_pressure_fr: "2.7",
  tpms_pressure_rl: "2.775",
  tpms_pressure_rr: "2.75",
  tpms_soft_warning_fl: "false",
  active_route: '{"error":"No active route available"}',
  active_route_destination: "nil",
  service_mode: "false",
};

describe("liveView", () => {
  test("reads a parked car", () => {
    const view = liveView(parked);
    expect(view.state).toBe("online");
    expect(view.since?.toISOString()).toBe("2026-10-01T11:41:31.770Z");
    expect(view.locked).toBe(true);
    expect(view.sentryMode).toBe(true);
    expect(view.openingsKnown).toBe(true);
    expect(view.openParts).toEqual([]);
    expect(view.charging).toMatchObject({
      pluggedIn: false,
      state: "Disconnected",
      limitPercent: 100,
      currentMaxA: 16,
    });
    expect(view.driving).toBeNull();
    expect(view.route).toBeNull();
    expect(view.climate).toEqual({
      on: false,
      preconditioning: false,
      keeperMode: "off",
      insideTemp: 22.2,
    });
    expect(view.software).toEqual({
      version: "2026.20.300",
      updateAvailable: false,
      updateVersion: null,
      downloadPercent: 0,
      installPercent: 0,
    });
    expect(view.tires).toEqual({
      frontLeft: 2.75,
      frontRight: 2.7,
      rearLeft: 2.775,
      rearRight: 2.75,
    });
    expect(view.tireWarnings).toEqual([]);
    expect(view.serviceMode).toBe(false);
  });

  test("names what is open", () => {
    const view = liveView({
      ...parked,
      frunk_open: "true",
      passenger_rear_window_open: "true",
      windows_open: "true",
      doors_open: "true",
      sun_roof_installed: "true",
      sun_roof_percent_open: "15",
    });
    expect(view.openParts).toEqual([
      "Frunk",
      "Passenger rear window",
      "A door",
      "Sunroof",
    ]);
  });

  test("reads a drive with a route", () => {
    const view = liveView({
      ...parked,
      shift_state: "D",
      speed: "72",
      power: "18",
      active_route: JSON.stringify({
        destination: "Home",
        energy_at_arrival: 73,
        miles_to_arrival: 6.2137,
        minutes_to_arrival: 23.4,
        traffic_minutes_delay: 2,
        location: { latitude: 1, longitude: 2 },
        error: null,
      }),
    });
    expect(view.driving).toEqual({ gear: "D", speedKmh: 72, powerKw: 18 });
    expect(view.route?.destination).toBe("Home");
    expect(view.route?.distanceKm).toBeCloseTo(10, 3);
    expect(view.route?.batteryAtArrival).toBe(73);
    expect(view.route?.trafficDelayMin).toBe(2);
  });

  test("reads an update and tire warnings", () => {
    const view = liveView({
      ...parked,
      update_available: "true",
      update_version: "",
      software_update:
        '{"installed_version":"2026.20.300","latest_version":"2026.32.6"}',
      download_perc: "45",
      tpms_soft_warning_rl: "true",
    });
    expect(view.software.updateVersion).toBe("2026.32.6");
    expect(view.software.downloadPercent).toBe(45);
    expect(view.tireWarnings).toEqual(["rear left"]);
  });

  test("dates the end of a charge from the time the estimate arrived", () => {
    const arrived = Date.UTC(2026, 9, 5, 22, 0);
    const charging = {
      ...parked,
      charging_state: "Charging",
      plugged_in: "true",
      charge_limit_soc: "80",
      time_to_full_charge: "2.5",
    };
    const view = liveView(
      charging,
      { time_to_full_charge: arrived },
      arrived + 600_000,
    );
    expect(view.charging.hoursToFull).toBe(2.5);
    expect(view.charging.fullAt?.toISOString()).toBe(
      "2026-10-06T00:30:00.000Z",
    );
    const unstamped = liveView(charging, {}, arrived);
    expect(unstamped.charging.fullAt?.getTime()).toBe(arrived + 9_000_000);
    expect(liveView(parked).charging.fullAt).toBeNull();
  });

  test("gives nulls for a car with no values", () => {
    const view = liveView({});
    expect(view.locked).toBeNull();
    expect(view.openingsKnown).toBe(false);
    expect(view.tires).toBeNull();
    expect(view.charging.pluggedIn).toBeNull();
  });
});

describe("updatePhase", () => {
  const software = (values: Record<string, string>) =>
    liveView({ version: "2026.32.7", ...values }).software;

  test("reads the idle install value of 1 as no update", () => {
    expect(
      updatePhase(
        software({
          update_available: "false",
          download_perc: "0",
          install_perc: "1",
          software_update:
            '{"installed_version":"2026.32.7","latest_version":"2026.32.7"}',
        }),
      ),
    ).toEqual({ kind: "current" });
    expect(updatePhase(software({ install_perc: "40" }))).toEqual({
      kind: "current",
    });
  });

  test("follows an update from download to install", () => {
    const pending = { update_available: "true", update_version: "2026.38.1" };
    expect(
      updatePhase(
        software({ ...pending, download_perc: "45", install_perc: "1" }),
      ),
    ).toEqual({ kind: "downloading", percent: 45 });
    expect(
      updatePhase(
        software({ ...pending, download_perc: "100", install_perc: "1" }),
      ),
    ).toEqual({ kind: "ready" });
    expect(
      updatePhase(
        software({ ...pending, download_perc: "100", install_perc: "37" }),
      ),
    ).toEqual({ kind: "installing", percent: 37 });
  });
});
