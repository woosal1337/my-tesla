import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import type { ChargePrices } from "./charge-cost";
import { createFormatter, type Formatter } from "./format";
import { database } from "./database";
import { isDemoMode } from "./demo/mode";
import {
  preferencesCookieName,
  readPreferencesCookie,
} from "./demo/preferences-cookie";
import { currentSession } from "./auth/session";
import {
  parsePreferences,
  resolveTimeZone,
  teslamateDefaults,
  type Preferences,
  type TeslaMateSettings,
} from "./preferences";
import {
  readUserPreferences,
  teslamateSettingsTag,
  userPreferencesTag,
} from "./preferences-store";
import { readTimeZone } from "./time-zone";
import type { PlaceStyle } from "./vehicle";

const feedViewer = new AsyncLocalStorage<string>();

export function asViewer<T>(email: string, work: () => Promise<T>): Promise<T> {
  return feedViewer.run(email.toLowerCase(), work);
}

export const currentViewer = cache(async (): Promise<string | null> => {
  const feed = feedViewer.getStore();
  if (feed) return feed;
  const signedIn = await currentSession();
  return signedIn?.user.email.toLowerCase() ?? null;
});

async function cachedTeslamateSettings(): Promise<TeslaMateSettings | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(teslamateSettingsTag);
  const [row] = await database()<TeslaMateSettings[]>`
    select
      unit_of_length::text as "unitOfLength",
      unit_of_temperature::text as "unitOfTemperature",
      unit_of_pressure::text as "unitOfPressure",
      preferred_range::text as "preferredRange",
      theme_mode as "themeMode"
    from settings
    order by id
    limit 1
  `;
  return row ?? null;
}

async function cachedUserPreferences(viewer: string): Promise<unknown> {
  "use cache";
  cacheLife("minutes");
  cacheTag(userPreferencesTag(viewer));
  return readUserPreferences(viewer);
}

export const baseline = cache(async (): Promise<Preferences> => {
  await connection();
  const settings = await cachedTeslamateSettings().catch(() => null);
  return teslamateDefaults(settings);
});

async function storedPreferences(): Promise<unknown> {
  if (isDemoMode()) {
    const jar = await cookies();
    return readPreferencesCookie(jar.get(preferencesCookieName)?.value);
  }
  const viewer = await currentViewer();
  if (!viewer) return null;
  for (const key of [viewer, "owner"]) {
    const stored = await cachedUserPreferences(key).catch(() => null);
    if (stored !== null) return stored;
  }
  return null;
}

export const getPreferences = cache(async (): Promise<Preferences> => {
  const stored = await storedPreferences();
  return parsePreferences(stored, await baseline());
});

const getTimeZone = cache(async (): Promise<string> => {
  return resolveTimeZone(await getPreferences(), readTimeZone(process.env));
});

export const getFormatter = cache(async (): Promise<Formatter> => {
  const [preferences, timeZone] = await Promise.all([
    getPreferences(),
    getTimeZone(),
  ]);
  return createFormatter(preferences, timeZone);
});

export async function getPlaceStyle(): Promise<PlaceStyle> {
  const { placeNames, addressDetail } = await getPreferences();
  return { placeNames, addressDetail };
}

export async function getRangeKind(): Promise<"rated" | "ideal"> {
  return (await getPreferences()).range;
}

export async function getEfficiencyRangeKind(): Promise<"rated" | "ideal"> {
  return (await baseline()).range;
}

export async function getChargePrices(): Promise<ChargePrices> {
  const { chargePrice, fastChargePrice } = await getPreferences();
  return { perKwh: chargePrice, fastPerKwh: fastChargePrice };
}
