import { describe, expect, test } from "bun:test";
import { generateDemo } from "./generate";

const end = new Date("2026-10-01T09:30:00Z");
const data = generateDemo({ seed: 20261001, end, days: 60 });

describe("generateDemo", () => {
  test("gives the same data for the same seed", () => {
    const again = generateDemo({ seed: 20261001, end, days: 60 });
    expect(again.drives.length).toBe(data.drives.length);
    expect(again.positions.at(-1)).toEqual(data.positions.at(-1));
  });

  test("makes about two months of commutes, trips and charges", () => {
    expect(data.drives.length).toBeGreaterThan(90);
    expect(data.chargingProcesses.length).toBeGreaterThan(8);
    const fast = data.chargingProcesses.filter((process) =>
      data.charges.some(
        (row) =>
          row.charging_process_id === process.id && row.fast_charger_present,
      ),
    );
    expect(fast.length).toBeGreaterThanOrEqual(3);
    expect(data.updates.map((update) => update.version.split(" ")[0])).toEqual([
      "2026.14.6",
      "2026.20.300",
    ]);
  });

  test("gives no drive to its own start place and no missing number", () => {
    for (const other of [
      data,
      generateDemo({
        seed: 7,
        end: new Date("2026-10-01T19:05:00Z"),
        days: 60,
      }),
    ]) {
      for (const drive of other.drives) {
        expect(drive.start_address_id).not.toBe(drive.end_address_id);
      }
      for (const row of [...other.positions, ...other.drives]) {
        for (const value of Object.values(row)) {
          if (typeof value === "number")
            expect(Number.isFinite(value)).toBe(true);
        }
      }
    }
  });

  test("keeps every record inside the window", () => {
    const first = data.states[0].start_date.getTime();
    for (const position of data.positions) {
      expect(position.date.getTime()).toBeGreaterThanOrEqual(first);
      expect(position.date.getTime()).toBeLessThanOrEqual(end.getTime());
    }
  });

  test("writes the states back to back with one open state at the end", () => {
    data.states.slice(1).forEach((state, index) => {
      expect(state.start_date.getTime()).toBe(
        data.states[index].end_date?.getTime() ?? Number.NaN,
      );
      expect(state.state).not.toBe(data.states[index].state);
    });
    expect(data.states.at(-1)?.end_date).toBeNull();
  });

  test("gives each drive its own positions and a real distance", () => {
    for (const drive of data.drives) {
      const points = data.positions.filter((row) => row.drive_id === drive.id);
      expect(points[0].id).toBe(drive.start_position_id);
      expect(points.at(-1)?.id).toBe(drive.end_position_id);
      expect(drive.distance).toBeGreaterThan(1);
      expect(drive.end_rated_range_km).toBeLessThan(drive.start_rated_range_km);
      expect(drive.speed_max).toBeLessThan(160);
    }
  });

  test("raises the battery level and the energy through each charge", () => {
    for (const process of data.chargingProcesses) {
      const rows = data.charges.filter(
        (row) => row.charging_process_id === process.id,
      );
      rows.slice(1).forEach((row, index) => {
        expect(row.battery_level).toBeGreaterThanOrEqual(
          rows[index].battery_level,
        );
        expect(row.charge_energy_added).toBeGreaterThanOrEqual(
          rows[index].charge_energy_added,
        );
      });
      expect(process.end_battery_level).toBeGreaterThan(
        process.start_battery_level,
      );
      expect(process.charge_energy_used).toBeGreaterThan(
        process.charge_energy_added,
      );
    }
  });

  test("lowers the rear left tire slowly until the refill", () => {
    const pressures = data.positions
      .filter((row) => row.tpms_pressure_rl !== null)
      .map((row) => (row.tpms_pressure_fl ?? 0) - (row.tpms_pressure_rl ?? 0));
    expect(Math.max(...pressures)).toBeGreaterThan(0.15);
  });
});
