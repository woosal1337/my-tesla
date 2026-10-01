import type { LiveValues } from "@/lib/live/topics";
import { demoCarId } from "./generate";

const closed = {
  doors_open: "false",
  windows_open: "false",
  trunk_open: "false",
  frunk_open: "false",
  driver_front_door_open: "false",
  driver_rear_door_open: "false",
  passenger_front_door_open: "false",
  passenger_rear_door_open: "false",
  driver_front_window_open: "false",
  driver_rear_window_open: "false",
  passenger_front_window_open: "false",
  passenger_rear_window_open: "false",
  is_user_present: "false",
  service_mode: "false",
  healthy: "true",
  active_route: '{"error":"No active route available"}',
};

const cars: Record<number, LiveValues> = {
  [demoCarId]: {
    ...closed,
    state: "online",
    locked: "true",
    sentry_mode: "true",
    shift_state: "P",
    plugged_in: "false",
    charging_state: "Disconnected",
    charge_limit_soc: "80",
    charge_port_door_open: "false",
    charge_current_request: "16",
    charge_current_request_max: "16",
    is_climate_on: "false",
    is_preconditioning: "false",
    climate_keeper_mode: "off",
    version: "2026.20.300",
    update_available: "true",
    update_version: "2026.32.6",
    download_perc: "100",
    install_perc: "0",
    tpms_soft_warning_fl: "false",
    tpms_soft_warning_fr: "false",
    tpms_soft_warning_rl: "false",
    tpms_soft_warning_rr: "false",
  },
  1: {
    ...closed,
    state: "asleep",
    locked: "true",
    sentry_mode: "false",
    shift_state: "P",
    plugged_in: "true",
    charging_state: "Complete",
    charge_limit_soc: "80",
    charge_port_door_open: "true",
    charge_current_request: "32",
    charge_current_request_max: "32",
    is_climate_on: "false",
    is_preconditioning: "false",
    climate_keeper_mode: "off",
    version: "2026.20.300",
    update_available: "false",
    download_perc: "0",
    install_perc: "0",
  },
};

export function demoLiveValues(carId: number): LiveValues {
  return cars[carId] ?? {};
}
