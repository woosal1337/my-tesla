import { demoFixtures } from "./fixtures";
import { generateDemo } from "./generate";
import { demoSchema } from "./schema";

export type DemoTarget = {
  exec(sql: string): Promise<unknown>;
  query(sql: string, params?: unknown[]): Promise<unknown>;
};

export type DemoSummary = {
  drives: number;
  charges: number;
  positions: number;
  states: number;
};

const rowsPerInsert = 500;

function parameter(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value === undefined ? null : value;
}

async function insert(
  target: DemoTarget,
  table: string,
  rows: Record<string, unknown>[],
) {
  if (!rows.length) return;
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  for (let start = 0; start < rows.length; start += rowsPerInsert) {
    const chunk = rows.slice(start, start + rowsPerInsert);
    const params: unknown[] = [];
    const tuples = chunk.map((row) => {
      const slots = columns.map((column) => {
        params.push(parameter(row[column]));
        return `$${params.length}`;
      });
      return `(${slots.join(", ")})`;
    });
    await target.query(
      `insert into ${table} (${columns.join(", ")}) values ${tuples.join(", ")}`,
      params,
    );
  }
}

export async function loadDemo(
  target: DemoTarget,
  options: { now: Date; days: number; seed: number },
): Promise<DemoSummary> {
  await target.exec(demoSchema);
  const data = generateDemo({
    seed: options.seed,
    end: options.now,
    days: options.days,
  });
  const fixtures = demoFixtures(options.now);
  await insert(target, "settings", fixtures.settings);
  await insert(target, "car_settings", fixtures.carSettings);
  await insert(target, "cars", fixtures.cars);
  await insert(target, "geofences", data.geofences);
  await insert(target, "addresses", data.addresses);
  await insert(target, "positions", data.positions);
  await insert(target, "drives", data.drives);
  await insert(target, "charging_processes", data.chargingProcesses);
  await insert(target, "charges", data.charges);
  await insert(target, "states", data.states);
  await insert(target, "updates", data.updates);
  return {
    drives: data.drives.length,
    charges: data.chargingProcesses.length,
    positions: data.positions.length,
    states: data.states.length,
  };
}
