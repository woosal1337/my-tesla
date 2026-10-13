import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type postgres from "postgres";
import { demoSchema } from "./demo/schema";
import { driveSessionsRelation } from "./drive-sessions-sql";
import { createSql } from "./sql-template";

let db: PGlite;
let sql: postgres.Sql;

const addresses = `
  insert into addresses (id, name, inserted_at, updated_at)
  values
    (10, 'Charger', now(), now()),
    (11, 'Motorway', now(), now()),
    (12, 'Home', now(), now())
`;

const drives = `
  insert into drives
    (id, car_id, start_date, end_date, distance, duration_min,
     start_position_id, end_position_id, start_address_id, end_address_id)
  values
    (1, 1, '2026-10-13 00:05', '2026-10-13 00:07', 0.7, 2, 1, 2, 10, 10),
    (2, 1, '2026-10-13 00:15', null, null, null, null, null, null, null),
    (3, 1, '2026-10-13 02:04', null, null, null, null, null, null, null),
    (4, 1, '2026-10-13 02:06', '2026-10-13 02:22', 23.3, 16, 30, 31, 11, 12),
    (5, 1, '2026-10-14 08:00', null, null, null, null, null, null, null),
    (6, 1, '2026-10-14 09:00', null, null, null, null, null, null, null),
    (7, 1, '2026-10-14 09:30', null, null, null, null, null, null, null),
    (8, 1, '2026-10-14 18:00', '2026-10-14 18:30', 20, 30, 60, 61, 12, 10),
    (9, 1, '2026-10-15 07:00', null, null, null, null, null, null, null),
    (20, 2, '2026-10-13 01:00', null, null, null, null, null, null, null),
    (21, 2, '2026-10-13 03:00', '2026-10-13 03:30', 15, 30, 80, 81, 12, 12)
`;

const positions = `
  insert into positions
    (id, car_id, drive_id, date, latitude, longitude, odometer, speed, power,
     elevation, rated_battery_range_km, ideal_battery_range_km, outside_temp)
  values
    (1, 1, 1, '2026-10-13 00:05', 40.7000, 31.6000, 999.3, 20, 10, 700, 300, 310, 9),
    (2, 1, 1, '2026-10-13 00:07', 40.7010, 31.6000, 1000, 0, 0, 700, 299, 309, 9),
    (10, 1, 2, '2026-10-13 00:16', 40.7011, 31.6001, 1000, 0, 5, 700, null, null, 9),
    (11, 1, 2, '2026-10-13 00:17', 40.7100, 31.5000, 1001, 60, 90, 720, 298, 308, 8),
    (12, 1, 2, '2026-10-13 01:00', 40.8000, 30.5000, 1090, 128, -40, null, null, null, 7),
    (13, 1, 2, '2026-10-13 02:03', 40.9000, 29.5000, 1217, 110, 30, 150, 80, 85, 6),
    (14, 1, 2, '2026-10-13 02:04', 40.9010, 29.4900, 1218.2, 100, 25, 140, null, null, 6),
    (20, 1, 3, '2026-10-13 02:04:36', 40.9020, 29.4800, 1218.4, 100, 20, 140, 79, 84, 6),
    (21, 1, 3, '2026-10-13 02:05:45', 40.9100, 29.4500, 1220.6, 95, 15, 130, null, null, 6),
    (30, 1, 4, '2026-10-13 02:06', 40.9105, 29.4490, 1220.8, 90, 15, 130, 78, 83, 6),
    (31, 1, 4, '2026-10-13 02:22', 41.0000, 29.2000, 1244.1, 0, 0, 90, 70, 75, 6),
    (40, 1, 5, '2026-10-14 08:00', 41.0000, 29.2000, 1244.1, 0, 0, 90, 70, 75, 6),
    (50, 1, 6, '2026-10-14 09:00', 41.0000, 29.2000, 1244.100, 0, 0, 90, 70, 75, 6),
    (51, 1, 6, '2026-10-14 09:01', 41.0000, 29.2000, 1244.105, 3, 1, 90, 70, 75, 6),
    (55, 1, 7, '2026-10-14 09:30', 41.0000, 29.2000, 1244.1, 0, 0, 90, 70, 75, 6),
    (56, 1, 7, '2026-10-14 10:00', 41.2000, 29.0000, 1274.1, 80, 40, 60, 60, 65, 6),
    (60, 1, 8, '2026-10-14 18:00', 41.5000, 28.5000, 1330, 0, 0, 60, 50, 55, 6),
    (61, 1, 8, '2026-10-14 18:30', 41.6000, 28.4000, 1350, 0, 0, 60, 45, 50, 6),
    (70, 1, 9, '2026-10-15 07:00', 41.6000, 28.4000, 1350, 0, 0, 60, 45, 50, 6),
    (71, 1, 9, '2026-10-15 07:10', 41.7000, 28.3000, 1362, 70, 30, 60, 42, 47, 6),
    (75, 2, 20, '2026-10-13 01:00', 41.0000, 29.0000, 500, 0, 0, 10, 200, 210, 6),
    (76, 2, 20, '2026-10-13 01:20', 41.1000, 29.1000, 518, 60, 20, 10, 190, 200, 6),
    (80, 2, 21, '2026-10-13 03:00', 41.1000, 29.1000, 518, 0, 0, 10, 190, 200, 6),
    (81, 2, 21, '2026-10-13 03:30', 41.2000, 29.2000, 533, 0, 0, 10, 180, 190, 6)
`;

type SessionRow = {
  id: number;
  endAt: Date;
  km: number;
  minutes: number;
  firstPosition: number;
  lastPosition: number;
  startRatedKm: number | null;
  endRatedKm: number | null;
  startIdealKm: number | null;
  endIdealKm: number | null;
  speedMax: number;
  powerMax: number;
  powerMin: number;
  ascent: number | null;
  descent: number | null;
  outsideC: number | null;
  from: string | null;
  to: string | null;
  leftOpen: boolean;
};

function sessions(carId = 1, picked = sql``): Promise<SessionRow[]> {
  return sql<SessionRow[]>`
    select
      d.id::int as id,
      d.end_date as "endAt",
      d.distance::float8 as km,
      d.duration_min::int as minutes,
      d.start_position_id::int as "firstPosition",
      d.end_position_id::int as "lastPosition",
      d.start_rated_range_km::float8 as "startRatedKm",
      d.end_rated_range_km::float8 as "endRatedKm",
      d.start_ideal_range_km::float8 as "startIdealKm",
      d.end_ideal_range_km::float8 as "endIdealKm",
      d.speed_max::int as "speedMax",
      d.power_max::int as "powerMax",
      d.power_min::int as "powerMin",
      d.ascent::int as ascent,
      d.descent::int as descent,
      d.outside_temp_avg::float8 as "outsideC",
      sa.name as "from",
      ea.name as "to",
      d.left_open as "leftOpen"
    from ${driveSessionsRelation(sql, carId, picked)} d
    left join addresses sa on sa.id = d.start_address_id
    left join addresses ea on ea.id = d.end_address_id
    order by d.start_date
  `;
}

async function session(id: number): Promise<SessionRow | undefined> {
  return (await sessions()).find((row) => row.id === id);
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec("set timezone = 'UTC'");
  await db.exec(demoSchema);
  for (const statement of [addresses, drives, positions]) {
    await db.exec(statement);
  }
  sql = createSql(
    async (text, params) => (await db.query(text, params)).rows as never,
  ) as unknown as postgres.Sql;
});

afterAll(async () => {
  await db.close();
});

describe("driveSessionsRelation", () => {
  test("keeps a closed drive as TeslaMate recorded it", async () => {
    const closed = await session(4);
    expect(closed?.leftOpen).toBe(false);
    expect(closed?.km).toBe(23.3);
    expect(closed?.minutes).toBe(16);
    expect(closed?.from).toBe("Motorway");
    expect(closed?.to).toBe("Home");
  });

  test("fills a drive that a later drive left open from its positions", async () => {
    const open = await session(2);
    expect(open?.leftOpen).toBe(true);
    expect(open?.endAt.toISOString()).toBe("2026-10-13T02:04:00.000Z");
    expect(open?.km).toBeCloseTo(218.2, 6);
    expect(open?.minutes).toBe(108);
    expect(open?.firstPosition).toBe(10);
    expect(open?.lastPosition).toBe(14);
    expect(open?.speedMax).toBe(128);
    expect(open?.powerMax).toBe(90);
    expect(open?.powerMin).toBe(-40);
    expect(open?.outsideC).toBe(7.2);
  });

  test("takes the first and the last known range", async () => {
    const open = await session(2);
    expect(open?.startRatedKm).toBe(298);
    expect(open?.endRatedKm).toBe(80);
    expect(open?.startIdealKm).toBe(308);
    expect(open?.endIdealKm).toBe(85);
  });

  test("sums the climb over the positions with an elevation", async () => {
    const open = await session(2);
    expect(open?.ascent).toBe(20);
    expect(open?.descent).toBe(580);
  });

  test("names the places from the drives before and after, when the car is there", async () => {
    const afterTheCharger = await session(2);
    expect(afterTheCharger?.from).toBe("Charger");
    expect(afterTheCharger?.to).toBeNull();
    const beforeTheNextDrive = await session(3);
    expect(beforeTheNextDrive?.from).toBeNull();
    expect(beforeTheNextDrive?.to).toBe("Motorway");
  });

  test("leaves a place empty when the next drive starts somewhere else", async () => {
    const lostOnTheWay = await session(7);
    expect(lostOnTheWay?.km).toBeCloseTo(30, 6);
    expect(lostOnTheWay?.to).toBeNull();
  });

  test("drops a left open drive with one position or under 10 m", async () => {
    const ids = (await sessions()).map((row) => row.id);
    expect(ids).toEqual([1, 2, 3, 4, 7, 8]);
  });

  test("leaves out the newest open drive, which is in progress", async () => {
    expect(await session(9)).toBeUndefined();
  });

  test("keeps the rows of one car", async () => {
    const rows = await sessions(2);
    expect(rows.map((row) => [row.id, row.leftOpen])).toEqual([
      [20, true],
      [21, false],
    ]);
  });

  test("fills only the drives that the caller picks", async () => {
    const newest = await sessions(
      1,
      sql`and d.start_date < '2026-10-14' order by d.start_date desc limit 2`,
    );
    expect(newest.map((row) => row.id)).toEqual([3, 4]);
  });
});
