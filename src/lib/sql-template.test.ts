import { describe, expect, test } from "bun:test";
import { createSql, escapeIdentifier } from "./sql-template";

function recorder() {
  const calls: { text: string; params: unknown[] }[] = [];
  const sql = createSql(async (text, params) => {
    calls.push({ text, params });
    return [{ ok: 1 }];
  });
  return { sql, calls };
}

describe("createSql", () => {
  test("numbers the parameters in order", async () => {
    const { sql, calls } = recorder();
    const rows =
      await sql`select * from drives where car_id = ${2} and id > ${10}`;
    expect(rows).toEqual([{ ok: 1 }]);
    expect(calls[0]).toEqual({
      text: "select * from drives where car_id = $1 and id > $2",
      params: [2, 10],
    });
  });

  test("puts nested fragments inline and keeps the numbering", async () => {
    const { sql, calls } = recorder();
    const filter = sql`and d.id = ${7}`;
    const empty = sql``;
    await sql`select ${1} from drives d where d.car_id = ${2} ${filter} ${empty}`;
    expect(calls[0].text).toBe(
      "select $1 from drives d where d.car_id = $2 and d.id = $3 ",
    );
    expect(calls[0].params).toEqual([1, 2, 7]);
    expect(calls).toHaveLength(1);
  });

  test("escapes identifiers with a table alias", async () => {
    const { sql, calls } = recorder();
    await sql`select ${sql("d.start_rated_range_km")} from drives d`;
    expect(calls[0].text).toBe(
      'select "d"."start_rated_range_km" from drives d',
    );
    expect(escapeIdentifier('we"ird')).toBe('"we""ird"');
  });

  test("sends dates as ISO strings and undefined as null", async () => {
    const { sql, calls } = recorder();
    await sql`select ${new Date("2026-10-01T00:00:00Z")}, ${undefined}`;
    expect(calls[0].params).toEqual(["2026-10-01T00:00:00.000Z", null]);
  });

  test("runs a fragment only when it is awaited", async () => {
    const { sql, calls } = recorder();
    const pending = sql`select 1`;
    expect(pending).toBeDefined();
    expect(calls).toHaveLength(0);
    await sql`select 1`.catch(() => []);
    expect(calls).toHaveLength(1);
  });
});
