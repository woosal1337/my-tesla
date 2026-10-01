import "server-only";
import postgres from "postgres";
import { readDatabaseConfig } from "./database-config";
import { isDemoMode } from "./demo/mode";
import { createSql, type Row } from "./sql-template";

let client: postgres.Sql | undefined;

function demoClient(): postgres.Sql {
  const sql = createSql(async (text, params) => {
    const { demoDatabase } = await import("./demo/database");
    const db = await demoDatabase();
    return (await db.query<Row>(text, params)).rows;
  });
  return sql as unknown as postgres.Sql;
}

export function database(): postgres.Sql {
  if (!client) {
    if (isDemoMode(process.env)) {
      client = demoClient();
      return client;
    }
    const config = readDatabaseConfig(process.env);
    client = postgres(config.url, {
      max: config.poolMax,
      connection: {
        application_name: "my-tesla",
        default_transaction_read_only: true,
        statement_timeout: config.statementTimeoutMs,
      },
    });
  }
  return client;
}
