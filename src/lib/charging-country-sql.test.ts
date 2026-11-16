import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type postgres from "postgres";
import { chargingCountry } from "./charging-country-sql";
import { demoSchema } from "./demo/schema";
import { createSql } from "./sql-template";

let db: PGlite;
let sql: postgres.Sql;

const addresses = `
  insert into addresses (id, raw, inserted_at, updated_at)
  values
    (1, '{"address": {"country_code": "tr"}}', now(), now()),
    (2, '{"address": {"country_code": "de"}}', now(), now()),
    (3, null, now(), now()),
    (4, '{"error": "Unable to geocode"}', now(), now())
`;

const charges = `
  insert into charging_processes (id, car_id, position_id, start_date, address_id)
  values
    (1, 1, 1, '2026-10-20 10:00', 1),
    (2, 1, 1, '2026-10-21 10:00', 1),
    (3, 1, 1, '2026-10-22 10:00', 2),
    (4, 1, 1, '2026-10-23 10:00', 3),
    (5, 1, 1, '2026-10-24 10:00', 3),
    (6, 1, 1, '2026-10-25 10:00', 4),
    (7, 1, 1, '2026-10-26 10:00', 4),
    (8, 1, 1, '2026-10-27 10:00', 3),
    (9, 1, 1, '2026-10-28 10:00', 4),
    (10, 1, 1, '2026-10-29 10:00', null)
`;

async function country(): Promise<string | null> {
  const [row] = await sql<{ code: string | null }[]>`
    select (${chargingCountry(sql)}) as code
  `;
  return row.code;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(demoSchema);
  await db.exec(addresses);
  sql = createSql(
    async (text, params) => (await db.query(text, params)).rows as never,
  ) as unknown as postgres.Sql;
});

afterAll(async () => {
  await db.close();
});

describe("chargingCountry", () => {
  test("gives null without a charge", async () => {
    expect(await country()).toBeNull();
  });

  test("takes the country with the most charges", async () => {
    await db.exec(charges);
    expect(await country()).toBe("tr");
  });

  test("skips addresses without a country code", async () => {
    await db.exec("delete from charging_processes where address_id in (1, 2)");
    expect(await country()).toBeNull();
  });
});
