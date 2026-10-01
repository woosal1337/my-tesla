"use server";

import { refresh, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/demo/mode";
import {
  preferencesCookieName,
  preferencesCookieOptions,
} from "@/lib/demo/preferences-cookie";
import { parsePreferences, type Preferences } from "@/lib/preferences";
import {
  userPreferencesTag,
  writeUserPreferences,
} from "@/lib/preferences-store";
import { baseline, currentViewer } from "@/lib/viewer";

export type SaveResult = { ok: true } | { ok: false; message: string };

async function saveDemoPreferences(preferences: Preferences | null) {
  const jar = await cookies();
  if (preferences) {
    jar.set(
      preferencesCookieName,
      JSON.stringify(preferences),
      preferencesCookieOptions,
    );
  } else {
    jar.delete(preferencesCookieName);
  }
  refresh();
}

export async function savePreferences(input: unknown): Promise<SaveResult> {
  try {
    if (isDemoMode()) {
      await saveDemoPreferences(parsePreferences(input, await baseline()));
      return { ok: true };
    }
    const viewer = await currentViewer();
    const base = await baseline();
    await writeUserPreferences(viewer, parsePreferences(input, base));
    updateTag(userPreferencesTag(viewer));
    return { ok: true };
  } catch {
    return { ok: false, message: "The server did not save the settings." };
  }
}

export async function resetPreferences(): Promise<SaveResult> {
  try {
    if (isDemoMode()) {
      await saveDemoPreferences(null);
      return { ok: true };
    }
    const viewer = await currentViewer();
    await writeUserPreferences(viewer, null);
    updateTag(userPreferencesTag(viewer));
    return { ok: true };
  } catch {
    return { ok: false, message: "The server did not reset the settings." };
  }
}
