import { describe, expect, test } from "bun:test";
import { checkHealth } from "./health";

describe("checkHealth", () => {
  test("reports ok when the database answers", async () => {
    expect(await checkHealth(async () => [{ "?column?": 1 }])).toEqual({
      httpStatus: 200,
      body: { status: "ok", database: "ok" },
    });
  });

  test("reports the database error as degraded", async () => {
    const result = await checkHealth(async () => {
      throw new Error('password authentication failed for user "reader"');
    });
    expect(result).toEqual({
      httpStatus: 503,
      body: {
        status: "degraded",
        database: "unreachable",
        detail: 'password authentication failed for user "reader"',
      },
    });
  });

  test("reports a database that does not answer in time", async () => {
    const result = await checkHealth(() => new Promise(() => {}), 20);
    expect(result.httpStatus).toBe(503);
    expect(result.body).toMatchObject({
      detail: "The database did not answer in 20 ms.",
    });
  });

  test("reports a thrown value that is not an Error", async () => {
    const result = await checkHealth(() => Promise.reject("socket closed"));
    expect(result.body).toMatchObject({ detail: "Unknown error." });
  });
});
