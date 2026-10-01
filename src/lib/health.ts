type HealthBody =
  | { status: "ok"; database: "ok" }
  | { status: "degraded"; database: "unreachable"; detail: string };

export type HealthResult = {
  httpStatus: 200 | 503;
  body: HealthBody;
};

const defaultPingTimeoutMs = 3_000;

export async function checkHealth(
  ping: () => Promise<unknown>,
  timeoutMs = defaultPingTimeoutMs,
): Promise<HealthResult> {
  try {
    await withTimeout(ping(), timeoutMs);
    return { httpStatus: 200, body: { status: "ok", database: "ok" } };
  } catch (error) {
    return {
      httpStatus: 503,
      body: {
        status: "degraded",
        database: "unreachable",
        detail: error instanceof Error ? error.message : "Unknown error.",
      },
    };
  }
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(new Error(`The database did not answer in ${timeoutMs} ms.`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
