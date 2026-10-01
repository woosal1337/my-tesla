import { PGlite } from "@electric-sql/pglite";
import { describe, expect, test } from "bun:test";
import { createSql } from "../sql-template";
import { loadDemo } from "./load";

describe("loadDemo", () => {
  test("fills a PGlite database that the app queries can read", async () => {
    const db = new PGlite();
    await db.exec("set timezone = 'UTC'");
    const now = new Date("2026-10-01T12:00:00Z");
    const summary = await loadDemo(db, { now, days: 14, seed: 20261001 });
    expect(summary.drives).toBeGreaterThan(10);

    const sql = createSql(
      async (text, params) => (await db.query(text, params)).rows as never,
    );
    const [counts] = await sql`
      select
        (select count(*)::int from drives where car_id = ${2}) as drives,
        (select count(*)::int from cars) as cars,
        (select max(date) at time zone 'UTC' from positions) as latest
    `;
    expect(counts.drives).toBe(summary.drives);
    expect(counts.cars).toBe(2);
    expect(counts.latest).toBeInstanceOf(Date);
    expect((counts.latest as Date).getTime()).toBeLessThanOrEqual(
      now.getTime(),
    );

    const [geofence] = await sql`
      select g.name, d.distance::float8 as km
      from drives d join geofences g on g.id = d.end_geofence_id
      where d.car_id = ${2}
      order by d.start_date
      limit 1
    `;
    expect(typeof geofence.name).toBe("string");
    expect(geofence.km).toBeGreaterThan(1);
    await db.close();
  });
});
