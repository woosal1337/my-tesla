import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

type StoreFile = {
  version: 1;
  users: Record<string, unknown>;
};

let queue: Promise<unknown> = Promise.resolve();

export const teslamateSettingsTag = "teslamate-settings";

export function userPreferencesTag(user: string): string {
  return `preferences:${user}`;
}

function preferencesPath(
  environment: Record<string, string | undefined> = process.env,
): string {
  const configured = environment.PREFERENCES_FILE?.trim();
  return configured || join(process.cwd(), ".data", "preferences.json");
}

async function readStore(path: string): Promise<StoreFile> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    if (
      parsed &&
      typeof parsed === "object" &&
      "users" in parsed &&
      parsed.users &&
      typeof parsed.users === "object"
    ) {
      return { version: 1, users: parsed.users as Record<string, unknown> };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return { version: 1, users: {} };
}

export async function readUserPreferences(user: string): Promise<unknown> {
  const store = await readStore(preferencesPath());
  return Object.hasOwn(store.users, user) ? store.users[user] : null;
}

export function writeUserPreferences(
  user: string,
  preferences: unknown,
): Promise<void> {
  const write = queue.then(async () => {
    const path = preferencesPath();
    const store = await readStore(path);
    if (preferences === null) delete store.users[user];
    else store.users[user] = preferences;
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const temporary = `${path}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`, {
      mode: 0o600,
    });
    await rename(temporary, path);
  });
  queue = write.catch(() => undefined);
  return write;
}
