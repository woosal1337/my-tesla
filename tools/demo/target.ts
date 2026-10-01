const demoDatabase = "teslamate_demo";
const localHosts = new Set(["127.0.0.1", "localhost"]);

export function assertDemoTarget(url: string | undefined): URL {
  let parsed: URL;
  try {
    parsed = new URL(url ?? "");
  } catch {
    throw new Error("Set DEMO_DATABASE_URL to the URL of the demo database.");
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (database !== demoDatabase) {
    throw new Error(
      `The seed tool writes only to "${demoDatabase}", not to "${database}".`,
    );
  }
  if (!localHosts.has(parsed.hostname)) {
    throw new Error(
      `Open a local tunnel to the demo database. The host "${parsed.hostname}" is not local.`,
    );
  }
  return parsed;
}
