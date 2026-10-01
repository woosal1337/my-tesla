export const preferencesCookieName = "my-tesla-settings";

export const preferencesCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
} as const;

const maximumLength = 3000;

export function readPreferencesCookie(value: string | undefined): unknown {
  if (!value || value.length > maximumLength) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
