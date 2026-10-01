import { describe, expect, test } from "bun:test";
import {
  DatabaseConfigError,
  defaultPoolMax,
  defaultStatementTimeoutMs,
  readDatabaseConfig,
} from "./database-config";

const readOnlyUrl = "postgresql://teslamate_ro:secret@database:5432/teslamate";

describe("readDatabaseConfig", () => {
  test("accepts the read-only role with the default limits", () => {
    expect(readDatabaseConfig({ DATABASE_URL: readOnlyUrl })).toEqual({
      url: readOnlyUrl,
      user: "teslamate_ro",
      statementTimeoutMs: defaultStatementTimeoutMs,
      poolMax: defaultPoolMax,
    });
  });

  test("reads the timeout and the pool size from the environment", () => {
    const config = readDatabaseConfig({
      DATABASE_URL: readOnlyUrl,
      STATEMENT_TIMEOUT_MS: "2500",
      DATABASE_POOL_MAX: "2",
    });
    expect(config.statementTimeoutMs).toBe(2500);
    expect(config.poolMax).toBe(2);
  });

  test("decodes a percent-encoded user name", () => {
    const config = readDatabaseConfig({
      DATABASE_URL: "postgres://dash%2Dreader:secret@database/teslamate",
    });
    expect(config.user).toBe("dash-reader");
  });

  test.each([
    [{}, "Set DATABASE_URL"],
    [{ DATABASE_URL: "   " }, "Set DATABASE_URL"],
    [{ DATABASE_URL: "not a url" }, "valid URL"],
    [{ DATABASE_URL: "mysql://reader:secret@database/teslamate" }, "scheme"],
    [{ DATABASE_URL: "postgresql://database/teslamate" }, "database user"],
  ])("refuses an unusable DATABASE_URL %#", (environment, message) => {
    expect(() => readDatabaseConfig(environment)).toThrow(DatabaseConfigError);
    expect(() => readDatabaseConfig(environment)).toThrow(message);
  });

  test.each(["teslamate", "postgres"])(
    "refuses the privileged user %s",
    (user) => {
      expect(() =>
        readDatabaseConfig({
          DATABASE_URL: `postgresql://${user}:secret@database/teslamate`,
        }),
      ).toThrow(`not the privileged user "${user}"`);
    },
  );

  test.each(["0", "-5", "1.5", "soon"])(
    "refuses the statement timeout %s",
    (value) => {
      expect(() =>
        readDatabaseConfig({
          DATABASE_URL: readOnlyUrl,
          STATEMENT_TIMEOUT_MS: value,
        }),
      ).toThrow("STATEMENT_TIMEOUT_MS");
    },
  );
});
