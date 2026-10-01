export type DatabaseConfig = {
  url: string;
  user: string;
  statementTimeoutMs: number;
  poolMax: number;
};

export class DatabaseConfigError extends Error {
  name = "DatabaseConfigError";
}

type Environment = Record<string, string | undefined>;

const privilegedUsers = new Set(["teslamate", "postgres"]);
const postgresProtocols = new Set(["postgres:", "postgresql:"]);

export const defaultStatementTimeoutMs = 15_000;
export const defaultPoolMax = 5;

export function readDatabaseConfig(environment: Environment): DatabaseConfig {
  const url = environment.DATABASE_URL?.trim();
  if (!url) {
    throw new DatabaseConfigError(
      "Set DATABASE_URL to the read-only TeslaMate role.",
    );
  }
  const parsed = parseUrl(url);
  if (!postgresProtocols.has(parsed.protocol)) {
    throw new DatabaseConfigError(
      "Use the postgres or postgresql scheme in DATABASE_URL.",
    );
  }
  const user = decodeURIComponent(parsed.username);
  if (!user) {
    throw new DatabaseConfigError("Put the database user in DATABASE_URL.");
  }
  if (privilegedUsers.has(user)) {
    throw new DatabaseConfigError(
      `Use the read-only role in DATABASE_URL, not the privileged user "${user}".`,
    );
  }
  return {
    url,
    user,
    statementTimeoutMs: readPositiveInteger(
      environment,
      "STATEMENT_TIMEOUT_MS",
      defaultStatementTimeoutMs,
    ),
    poolMax: readPositiveInteger(
      environment,
      "DATABASE_POOL_MAX",
      defaultPoolMax,
    ),
  };
}

function parseUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new DatabaseConfigError("Set DATABASE_URL to a valid URL.");
  }
}

function readPositiveInteger(
  environment: Environment,
  name: string,
  fallback: number,
): number {
  const value = environment[name]?.trim();
  if (!value) {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new DatabaseConfigError(`Set ${name} to a positive whole number.`);
  }
  return number;
}
