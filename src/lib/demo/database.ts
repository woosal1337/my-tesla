import "server-only";
import { PGlite } from "@electric-sql/pglite";
import { loadDemo } from "./load";

const maximumAgeMs = 6 * 60 * 60 * 1000;
const demoDays = 60;
const demoSeed = 20261001;

let current: { db: Promise<PGlite>; bootedAt: number } | undefined;

async function boot(now: Date): Promise<PGlite> {
  const db = new PGlite();
  await db.exec("set timezone = 'UTC'");
  await loadDemo(db, { now, days: demoDays, seed: demoSeed });
  return db;
}

export function demoDatabase(): Promise<PGlite> {
  const now = Date.now();
  if (!current || now - current.bootedAt > maximumAgeMs) {
    current = { db: boot(new Date(now)), bootedAt: now };
    current.db.catch(() => {
      current = undefined;
    });
  }
  return current.db;
}
