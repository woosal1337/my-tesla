import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cookies, headers } from "next/headers";
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
import { identityHeader, viewerKey } from "./identity";
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

export const currentViewer = cache(async (): Promise<string> => {
  const list = await headers();
  return viewerKey(list.get(identityHeader()));
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
  return cachedUserPreferences(viewer).catch(() => null);
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

export async function getChargePrices(): Promise<ChargePrices> {
  const { chargePrice, fastChargePrice } = await getPreferences();
  return { perKwh: chargePrice, fastPerKwh: fastChargePrice };
}
