import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type postgres from "postgres";
import { demoSchema } from "./demo/schema";
import { createSql } from "./sql-template";
import { tripLegsQuery, type TripSelection } from "./trip-legs-sql";

let db: PGlite;
let sql: postgres.Sql;

const roadTripper = 1;
const stopper = 2;

const cars = `
  insert into cars
    (id, eid, vid, vin, settings_id, efficiency, inserted_at, updated_at)
  values
    (1, 1, 1, 'VIN1', 1, 0.15, now(), now()),
    (2, 2, 2, 'VIN2', 2, 0.15, now(), now())
`;

const drives = `
  insert into drives (id, car_id, start_date, end_date)
  values
    (101, 1, '2025-06-10 06:00', '2025-06-10 07:30'),
    (102, 1, '2025-06-10 07:50', '2025-06-10 08:50'),
    (103, 1, '2025-06-10 10:00', '2025-06-10 11:20'),
    (104, 1, '2025-06-11 09:00', '2025-06-11 09:30'),
    (105, 1, '2025-06-11 10:15', '2025-06-11 10:45'),
    (106, 1, '2025-06-11 10:50', null),
    (701, 2, '2025-06-10 06:00', '2025-06-10 07:00'),
    (702, 2, '2025-06-10 08:00', '2025-06-10 09:00'),
    (703, 2, '2025-06-10 10:00', '2025-06-10 11:00'),
    (704, 2, '2025-06-10 12:00', '2025-06-10 13:00'),
    (705, 2, '2025-06-10 14:00', '2025-06-10 15:00')
`;

const charges = `
  insert into charging_processes (id, car_id, position_id, start_date, end_date)
  values
    (1, 1, 1, '2025-06-10 09:00', '2025-06-10 09:40'),
    (2, 1, 1, '2025-06-10 22:00', '2025-06-11 04:00'),
    (3, 2, 1, '2025-06-10 07:00', '2025-06-10 07:40'),
    (4, 2, 1, '2025-06-10 10:00', '2025-06-10 10:20'),
    (5, 2, 1, '2025-06-10 10:30', '2025-06-10 10:50')
`;

async function legs(carId: number, selection: TripSelection) {
  const rows = await tripLegsQuery(sql, { carId, selection });
  return rows.map((row) => [row.driveId, row.tripId, row.chargedBefore]);
}

function day(date: string): TripSelection {
  const start = new Date(`${date}T00:00:00Z`);
  return { range: { start, end: new Date(start.getTime() + 86_400_000) } };
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec("set timezone = 'UTC'");
  await db.exec(demoSchema);
  for (const statement of [cars, drives, charges]) {
    await db.exec(statement);
  }
  sql = createSql(
    async (text, params) => (await db.query(text, params)).rows as never,
  ) as unknown as postgres.Sql;
});

afterAll(async () => {
  await db.close();
});

describe("tripLegsQuery", () => {
  test("joins drives across a short stop and across a longer stop with a charge", async () => {
    expect(await legs(roadTripper, day("2025-06-10"))).toEqual([
      [101, 101, false],
      [102, 101, false],
      [103, 101, true],
    ]);
  });

  test("starts a new trip after a night and after a stop above 30 minutes", async () => {
    expect(await legs(roadTripper, day("2025-06-11"))).toEqual([
      [104, 104, false],
      [105, 105, false],
    ]);
  });

  test("counts a charge only when it starts inside the stop", async () => {
    expect(await legs(stopper, day("2025-06-10"))).toEqual([
      [701, 701, false],
      [702, 701, true],
      [703, 703, false],
      [704, 704, false],
      [705, 705, false],
    ]);
  });

  test("selects a trip by its start, not by the start of a later leg", async () => {
    const afterTheFirstLeg: TripSelection = {
      range: {
        start: new Date("2025-06-10T07:00:00Z"),
        end: new Date("2025-06-11T00:00:00Z"),
      },
    };
    expect(await legs(roadTripper, afterTheFirstLeg)).toEqual([]);
  });

  test("finds the whole trip from any of its drives", async () => {
    const fromTheMiddle = await legs(roadTripper, { driveId: 102 });
    expect(fromTheMiddle.map(([driveId]) => driveId)).toEqual([101, 102, 103]);
    expect(await legs(roadTripper, { driveId: 104 })).toEqual([
      [104, 104, false],
    ]);
  });

  test("gives no trip for a drive of another car or an open drive", async () => {
    expect(await legs(roadTripper, { driveId: 701 })).toEqual([]);
    expect(await legs(roadTripper, { driveId: 106 })).toEqual([]);
  });
});
