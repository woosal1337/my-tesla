import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type postgres from "postgres";
import { noPrices } from "./charge-cost";
import { chargeSessionsRelation } from "./charge-sessions-sql";
import type { LevelTime } from "./charge-time";
import { chargeLevelTimesQuery } from "./charge-time-sql";
import { demoSchema } from "./demo/schema";
import { createSql, type Fragment } from "./sql-template";

let db: PGlite;
let sql: postgres.Sql;

const since = new Date("2026-09-01T00:00:00Z");

const processes = `
  insert into charging_processes
    (id, car_id, position_id, start_date, end_date, charge_energy_added)
  values
    (1, 1, 1, '2026-10-01 10:00', '2026-10-01 10:03', 12),
    (2, 1, 1, '2026-10-02 10:00', '2026-10-02 10:04', 14),
    (3, 1, 1, '2026-10-03 12:00', '2026-10-03 12:13', 2),
    (4, 2, 1, '2026-10-04 10:00', '2026-10-04 10:03', 12),
    (5, 1, 1, '2026-10-05 10:00', '2026-10-05 10:03', 0.5),
    (6, 1, 1, '2026-08-01 10:00', '2026-08-01 10:03', 12)
`;

function sample(
  id: number,
  process: number,
  date: string,
  level: number,
  power: number,
  fast: boolean,
) {
  return `(${id}, ${process}, '${date}', ${level}, 0, ${power}, ${fast}, 100)`;
}

const charges = `
  insert into charges
    (id, charging_process_id, date, battery_level, charge_energy_added,
     charger_power, fast_charger_present, ideal_battery_range_km)
  values
    ${[
      sample(1, 1, "2026-10-01 10:00:00", 20, 150, true),
      sample(2, 1, "2026-10-01 10:00:30", 21, 150, true),
      sample(3, 1, "2026-10-01 10:01:10", 22, 150, true),
      sample(4, 1, "2026-10-01 10:02:10", 23, 150, true),
      sample(5, 2, "2026-10-02 10:00:00", 20, 140, true),
      sample(6, 2, "2026-10-02 10:00:50", 21, 140, true),
      sample(7, 2, "2026-10-02 10:01:30", 22, 140, true),
      sample(8, 2, "2026-10-02 10:03:10", 23, 140, true),
      sample(9, 3, "2026-10-03 12:00:00", 50, 11, false),
      sample(10, 3, "2026-10-03 12:03:20", 51, 11, false),
      sample(11, 3, "2026-10-03 12:10:00", 51, 0, false),
      sample(12, 3, "2026-10-03 12:11:00", 51, 11, false),
      sample(13, 3, "2026-10-03 12:12:30", 52, 11, false),
      sample(14, 4, "2026-10-04 10:00:00", 20, 150, true),
      sample(15, 4, "2026-10-04 10:02:00", 21, 150, true),
      sample(16, 5, "2026-10-05 10:00:00", 60, 150, true),
      sample(17, 5, "2026-10-05 10:02:00", 61, 150, true),
      sample(18, 6, "2026-08-01 10:00:00", 30, 150, true),
      sample(19, 6, "2026-08-01 10:02:00", 31, 150, true),
    ].join(",\n    ")}
`;

async function levelTimes(carId: number): Promise<LevelTime[]> {
  return chargeLevelTimesQuery(
    sql,
    chargeSessionsRelation(sql, carId, noPrices),
    carId,
    since,
  );
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec("set timezone = 'UTC'");
  await db.exec(demoSchema);
  await db.exec(processes);
  await db.exec(charges);
  sql = createSql(
    async (text, params) => (await db.query(text, params)).rows as never,
  ) as unknown as postgres.Sql;
});

afterAll(async () => {
  await db.close();
});

describe("chargeLevelTimesQuery", () => {
  test("gives the median and the slow time at each percent of DC charges", async () => {
    const rows = (await levelTimes(1)).filter((row) => row.fast);
    expect(rows).toEqual([
      { fast: true, level: 20, sessions: 2, typicalS: 40, slowS: 48 },
      { fast: true, level: 21, sessions: 2, typicalS: 40, slowS: 40 },
      { fast: true, level: 22, sessions: 2, typicalS: 80, slowS: 96 },
    ]);
  });

  test("drops a gap in the record and a sample without power", async () => {
    const rows = (await levelTimes(1)).filter((row) => !row.fast);
    expect(rows).toEqual([
      { fast: false, level: 50, sessions: 1, typicalS: 200, slowS: 200 },
      { fast: false, level: 51, sessions: 1, typicalS: 90, slowS: 90 },
    ]);
  });

  test("leaves out the level where a charge stopped", async () => {
    const levels = (await levelTimes(1)).map((row) => row.level);
    expect(levels).not.toContain(23);
    expect(levels).not.toContain(52);
  });

  test("leaves out a small charge and a charge before the window", async () => {
    const levels = (await levelTimes(1)).map((row) => row.level);
    expect(levels).not.toContain(60);
    expect(levels).not.toContain(30);
  });

  test("keeps the rows of one car", async () => {
    expect(await levelTimes(2)).toEqual([
      { fast: true, level: 20, sessions: 1, typicalS: 120, slowS: 120 },
    ]);
  });

  test("finds the charger type once for each charge", async () => {
    const query = chargeLevelTimesQuery(
      sql,
      chargeSessionsRelation(sql, 1, noPrices),
      1,
      since,
    ) as unknown as Fragment;
    const params: unknown[] = [];
    const plan = await db.query<{ "QUERY PLAN": string }>(
      `explain (costs off) ${query.compile(params)}`,
      params,
    );
    expect(plan.rows.map((row) => row["QUERY PLAN"]).join("\n")).toContain(
      "CTE picked",
    );
  });
});
